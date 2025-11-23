import { requirePayment } from "@omni402/sdk/next";

export const GET = requirePayment(
  {
    amount: "100000", // 0.1 USDC
    payTo: "0xA8bC2cDB7e86C4aB3c2F62dED22bC14f8149137c", // Merchant address
  },
  async (req) => {
    return Response.json({
      success: true,
      content: "You've successfully accessed premium content!",
      timestamp: new Date().toISOString(),
    });
  }
);
