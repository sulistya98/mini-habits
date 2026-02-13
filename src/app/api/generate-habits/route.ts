import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { auth } from "../../../../auth";

const ALLOWED_MODELS = [
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-2.0-flash",
  "gemini-2.0-flash-exp",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-pro",
];

const SYSTEM_PROMPT = `You are an expert in the Mini Habits methodology by Stephen Guise, acting as a friendly coach. Your job is to help the user design daily mini habits — actions so small they're impossible to fail.

Rules for mini habits:
- Each takes less than 2 minutes
- Each is a specific, physical action (not a vague intention)
- Follows the "too small to fail" principle
- Builds toward the user's larger goal over time

Conversation flow:
1. First, understand the user's goal. Ask 2-3 short clarifying questions (current experience, available time, obstacles).
2. Once you understand, propose 3-5 mini habits.
3. If the user gives feedback, refine your proposals.
4. If the user asks HOW to do a habit or asks for advice, answer their question with practical, actionable tips. Do NOT re-propose habits — just help them understand how to do the one they asked about. Set "habits" to null when answering questions.
5. Only propose new or revised habits when the user explicitly asks for different habits or you're refining based on their feedback.

EXISTING_HABITS_PLACEHOLDER

You MUST always respond with valid JSON in this exact format:
{"message": "your conversational text here", "habits": null}

When proposing habits, use this format:
{"message": "your text explaining the habits", "habits": [{"name": "Habit name (max 8 words)", "why": "One sentence explanation"}]}

Set "habits" to null when you're asking questions or chatting without proposing habits.
Never include anything outside the JSON object.`;

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { apiKey, modelName, messages, existingHabits } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ error: "API Key is required" }, { status: 400 });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages are required" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const targetModel = ALLOWED_MODELS.includes(modelName) ? modelName : "gemini-1.5-flash";

    const habitsContext = existingHabits?.length
      ? `The user already tracks these habits:\n${existingHabits.map((h: string) => `- ${h}`).join("\n")}\n\nAvoid suggesting duplicates. You can build on existing habits or suggest complementary ones.`
      : "The user has no existing habits yet.";

    const systemInstruction = SYSTEM_PROMPT.replace(
      "EXISTING_HABITS_PLACEHOLDER",
      habitsContext
    );

    // Map messages: trim to last 40, map "assistant" -> "model" for Gemini
    const trimmedMessages = messages.slice(-40);
    const contents = trimmedMessages.map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const model = genAI.getGenerativeModel({
      model: targetModel,
      systemInstruction,
    });

    let responseText: string;
    try {
      const result = await model.generateContent({ contents });
      responseText = result.response.text();
    } catch (apiError) {
      const msg = apiError instanceof Error ? apiError.message : "Gemini API call failed";
      console.error("Gemini API error:", msg);
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    // Try parsing as JSON first
    try {
      const parsed = JSON.parse(responseText);
      return NextResponse.json({
        message: parsed.message || responseText,
        habits: parsed.habits || null,
      });
    } catch {
      // Fallback: try to extract JSON from markdown code blocks
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return NextResponse.json({
            message: parsed.message || responseText,
            habits: parsed.habits || null,
          });
        } catch {
          // Fall through
        }
      }

      // Final fallback: return raw text as message
      return NextResponse.json({
        message: responseText,
        habits: null,
      });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to generate response";
    console.error("Generate Habits Error:", msg);
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
