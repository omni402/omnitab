import express from "express";
import dotenv from "dotenv";
import { verifyPayment } from "./verify";
import { settlePayment } from "./settle";
import { config } from "./config";

dotenv.config();

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.post("/verify", async (req, res) => {
  try {
    const result = await verifyPayment(req.body);
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
    const result = await settlePayment(req.body);
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
