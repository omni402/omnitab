import {
    HashLock,
    NetworkEnum,
    OrderStatus,
    PresetEnum,
    PrivateKeyProviderConnector,
    SDK
} from '@1inch/cross-chain-sdk'
import Web3 from 'web3'
import { randomBytes } from 'node:crypto'
import 'dotenv/config'

const ERC20_ABI = [
    {
        "inputs": [{"name": "spender", "type": "address"}, {"name": "amount", "type": "uint256"}],
        "name": "approve",
        "outputs": [{"name": "", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"name": "owner", "type": "address"}, {"name": "spender", "type": "address"}],
        "name": "allowance",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
]

const AGGREGATION_ROUTER = '0x111111125421cA6dc452d289314280a0f8842A65'
const ARBITRUM_USDC = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
const BASE_USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

async function main() {
    let privateKey = process.env.DEPLOYER_PRIVATE_KEY
    if (!privateKey) {
        throw new Error('DEPLOYER_PRIVATE_KEY not set')
    }
    if (!privateKey.startsWith('0x')) {
        privateKey = '0x' + privateKey
    }

    const authKey = process.env.ONEINCH_API_KEY
    if (!authKey) {
        throw new Error('ONEINCH_API_KEY not set')
    }

    const rpc = process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc'

    console.log('Fusion+ Cross-Chain Swap')
    console.log('Arbitrum USDC -> Base USDC')

    const web3 = new Web3(rpc)
    const walletAddress = web3.eth.accounts.privateKeyToAccount(privateKey).address
    console.log('Wallet:', walletAddress)

    const sdk = new SDK({
        url: 'https://api.1inch.dev/fusion-plus',
        authKey,
        blockchainProvider: new PrivateKeyProviderConnector(privateKey, web3 as any)
    })

    const amount = '1000000'
    console.log('\nAmount:', Number(amount) / 1e6, 'USDC')

    const quote = await sdk.getQuote({
        amount,
        srcChainId: NetworkEnum.ARBITRUM,
        dstChainId: NetworkEnum.COINBASE,
        enableEstimate: true,
        srcTokenAddress: ARBITRUM_USDC,
        dstTokenAddress: BASE_USDC,
        walletAddress
    })

    const preset = PresetEnum.fast
    console.log('Estimated output:', Number(quote.presets[preset].auctionEndAmount) / 1e6, 'USDC')

    const secrets = Array.from({
        length: quote.presets[preset].secretsCount
    }).map(() => '0x' + randomBytes(32).toString('hex'))

    const hashLock = secrets.length === 1
        ? HashLock.forSingleFill(secrets[0])
        : HashLock.forMultipleFills(HashLock.getMerkleLeaves(secrets))

    const secretHashes = secrets.map((s) => HashLock.hashSecret(s))

    const usdcContract = new web3.eth.Contract(ERC20_ABI as any, ARBITRUM_USDC)
    const currentAllowance = await usdcContract.methods.allowance(walletAddress, AGGREGATION_ROUTER).call()

    if (BigInt(String(currentAllowance)) < BigInt(amount)) {
        console.log('Approving USDC...')
        const approveTx = usdcContract.methods.approve(AGGREGATION_ROUTER, '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
        const gas = await approveTx.estimateGas({ from: walletAddress })
        const gasPrice = await web3.eth.getGasPrice()
        const nonce = await web3.eth.getTransactionCount(walletAddress)
        const signedTx = await web3.eth.accounts.signTransaction(
            {
                from: walletAddress,
                to: ARBITRUM_USDC,
                data: approveTx.encodeABI(),
                gas,
                gasPrice,
                nonce
            },
            privateKey
        )
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction!)
        console.log('Approved:', receipt.transactionHash)
    }

    console.log('\nCreating order...')
    const { hash, quoteId, order } = await sdk.createOrder(quote, {
        walletAddress,
        hashLock,
        preset,
        source: 'omnitab',
        secretHashes
    })
    console.log('Order hash:', hash)

    await sdk.submitOrder(
        quote.srcChainId,
        order as any,
        quoteId,
        secretHashes
    )
    console.log('Order submitted')

    console.log('\nMonitoring...')
    let lastStatus = ''

    while (true) {
        const secretsToShare = await sdk.getReadyToAcceptSecretFills(hash)

        if (secretsToShare.fills.length) {
            for (const { idx } of secretsToShare.fills) {
                await sdk.submitSecret(hash, secrets[idx])
                console.log('Secret shared for fill:', idx)
            }
        }

        const { status } = await sdk.getOrderStatus(hash)

        if (status !== lastStatus) {
            console.log('Status:', status)
            lastStatus = status
        }

        if (
            status === OrderStatus.Executed ||
            status === OrderStatus.Expired ||
            status === OrderStatus.Refunded
        ) {
            break
        }

        await new Promise(resolve => setTimeout(resolve, 2000))
    }

    const finalStatus = await sdk.getOrderStatus(hash)
    if (finalStatus.status === OrderStatus.Executed) {
        console.log('\nSwap Complete!')
    } else {
        console.log('\nSwap ended with status:', finalStatus.status)
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
