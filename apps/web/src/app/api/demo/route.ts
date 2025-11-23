import { requirePayment } from "@omni402/sdk/next";

export const GET = requirePayment(
  {
    amount: "100000", // 0.1 USDC
    payTo: "0xd2a26541518be2802a41c029ee7943994b996763", // Demo address
  },
  async (req) => {
    return Response.json({
      success: true,
      content: "You've successfully accessed premium content!",
      timestamp: new Date().toISOString(),
    });
  }
);
