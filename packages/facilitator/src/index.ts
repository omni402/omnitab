import express from "express";
import dotenv from "dotenv";
import { verifyPayment } from "./verify";
import { settlePayment } from "./settle";
import { getSupported } from "./supported";
import { VerifyRequestSchema } from "./schemas";
import { config } from "./config";

dotenv.config();

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/supported", (req, res) => {
  res.json(getSupported());
});

app.post("/verify", async (req, res) => {
  try {
    const parsed = VerifyRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        isValid: false,
        invalidReason: "invalid_payment_payload",
        payer: null,
      });
      return;
    }
    const result = await verifyPayment(parsed.data);
    res.json(result);
  } catch (error) {
    console.error("Verify error:", error);
    res.status(500).json({
      isValid: false,
      invalidReason: "network_error",
      payer: null,
    });
  }
});

app.post("/settle", async (req, res) => {
  try {
    const parsed = VerifyRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        errorReason: "invalid_payment_payload",
        transaction: "",
        network: "",
        payer: null,
      });
      return;
    }
    const result = await settlePayment(parsed.data);
    res.json(result);
  } catch (error) {
    console.error("Settle error:", error);
    res.status(500).json({
      success: false,
      errorReason: "network_error",
      transaction: "",
      network: "",
      payer: null,
    });
  }
});

app.listen(config.port, () => {
  console.log(`Facilitator running on port ${config.port}`);
});
