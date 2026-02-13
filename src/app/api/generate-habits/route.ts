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

    const { apiKey, modelName, goal, context } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ error: "API Key is required" }, { status: 400 });
    }

    if (!goal) {
      return NextResponse.json({ error: "Goal is required" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const targetModel = ALLOWED_MODELS.includes(modelName) ? modelName : "gemini-1.5-flash";
    const model = genAI.getGenerativeModel({ model: targetModel });

    const prompt = `
You are an expert in the Mini Habits methodology by Stephen Guise. The user has a goal and you must break it down into 3-5 "mini habits" — daily actions so small they are impossible to fail.

Rules for each mini habit:
- Takes less than 2 minutes to complete
- Is a specific, physical action (not a vague intention)
- Follows the "too small to fail" principle
- Builds toward the larger goal over time

User's goal: "${goal}"
${context ? `Additional context: "${context}"` : ""}

Respond ONLY with a JSON array. Each element has "name" (the habit, max 6 words) and "why" (one sentence explaining how it helps).
Example format: [{"name": "Put on running shoes", "why": "Removes the friction of getting started with exercise."}]
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Failed to parse AI response. Please try again." },
        { status: 500 }
      );
    }

    const habits = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ habits });
  } catch (error: any) {
    console.error("Generate Habits Error:", error?.message);
    const message = error?.message || "Failed to generate habits";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
