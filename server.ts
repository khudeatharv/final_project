import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Stripe from "stripe";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const gemini = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/create-checkout-session", async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe not configured" });
    }

    try {
      const { userId, email } = req.body;
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "StudyFlow AI Pro Plan",
                description: "Unlimited PDF uploads and advanced AI features",
              },
              unit_amount: 700, // $7.00
              recurring: {
                interval: "month",
              },
            },
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${process.env.APP_URL}?success=true`,
        cancel_url: `${process.env.APP_URL}?canceled=true`,
        client_reference_id: userId,
        customer_email: email,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai", async (req, res) => {
    if (!gemini) {
      return res.status(500).json({ error: "Gemini not configured" });
    }

    const { type, text, topic, days } = req.body as {
      type?: "summary" | "quiz" | "flashcards" | "study-plan";
      text?: string;
      topic?: string;
      days?: number;
    };

    try {
      const prompts = {
        summary: `Summarize these study notes concisely. Use markdown for formatting:\n\n${text ?? ""}`,
        quiz: `Create 5 multiple choice questions from the following text.\nFormat the output as a clean markdown list with options A, B, C, D and indicate the correct answer at the end of each question.\n\nText:\n${text ?? ""}`,
        flashcards: `Create 10 flashcards from the following text.\nFormat each flashcard as:\nQ: [Question]\nA: [Answer]\n---\n\nText:\n${text ?? ""}`,
        "study-plan": `Create a detailed ${days ?? 7}-day study plan for the topic: "${topic ?? ""}". Include daily goals, key concepts to cover, and recommended study techniques. Use markdown.`,
      } as const;

      if (!type || !(type in prompts)) {
        return res.status(400).json({ error: "Invalid AI request type" });
      }

      if ((type === "study-plan" && !topic) || (type !== "study-plan" && !text)) {
        return res.status(400).json({ error: "Missing required payload" });
      }

      const response = await gemini.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompts[type],
      });

      return res.json({ text: response.text ?? "" });
    } catch (error: any) {
      return res.status(500).json({ error: error?.message || "AI request failed" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
