import express from "express";
import dotenv from "dotenv";
import { verifyPayment } from "./verify";
import { settlePayment } from "./settle";
import { getSupported } from "./supported";
import { VerifyRequestSchema } from "./schemas";
import { config } from "./config";
import { prisma } from "./db";
import { startEventListener } from "./listener";

dotenv.config();

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/supported", (req, res) => {
  res.json(getSupported());
});

app.get("/payments/:merchant", async (req, res) => {
  try {
    const { merchant } = req.params;
    const payments = await prisma.payment.findMany({
      where: {
        merchantAddress: merchant.toLowerCase(),
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });
    res.json({ payments });
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ error: "Internal error" });
  }
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

const server = app.listen(config.port, async () => {
  console.log(`Facilitator running on port ${config.port}`);
  await startEventListener();
});

async function shutdown() {
  console.log("Shutting down...");
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
