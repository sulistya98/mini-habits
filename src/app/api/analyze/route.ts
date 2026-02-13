import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { auth } from "../../../../auth";

const ALLOWED_MODELS = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash", "gemini-2.0-flash-exp", "gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-pro"];

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { apiKey, context, modelName } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ error: "API Key is required" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const targetModel = ALLOWED_MODELS.includes(modelName) ? modelName : "gemini-1.5-flash";
    const model = genAI.getGenerativeModel({ model: targetModel });

    const prompt = `
      You are a minimalist habit coach. Analyze the following habit data for the last 7-14 days.
      Your goal is to provide a "Weekly Review" that is concise, encouraging, and actionable.

      Data:
      ${context}

      Output Requirements:
      1.  **Summary:** One sentence on overall performance.
      2.  **Insight:** One specific observation based on the data (correlation between notes and completion, streaks, etc.).
      3.  **Action:** One small, specific suggestion for next week.
      
      Keep the tone calm, objective, and supportive. Total output should be under 100 words. Return plain text, no markdown formatting beyond simple bullet points if needed.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ result: text });
  } catch (error: any) {
    console.error("AI Analysis Error:", error?.message);
    const message = error?.message || "Failed to generate insight";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
