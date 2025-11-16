import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

export const maxDuration = 300;

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { error: "REPLICATE_API_TOKEN is not configured" },
        { status: 500 }
      );
    }

    const systemPrompt =
      "You are assisting Nautilus Builders with job-site notes. " +
      "Your job is to very gently clean up the text while preserving the original meaning and structure.\n\n" +
      "STRICT RULES:\n" +
      "1. Do NOT invent or add information that is not already in the text.\n" +
      "2. Preserve all numbers, measurements, dates, and dollar amounts exactly.\n" +
      "3. Keep line breaks and bullet structure as close as possible to the original.\n" +
      "4. Only fix clear spelling mistakes and very obvious grammar issues.\n" +
      "5. Do not reorder items or merge separate lines.\n" +
      "6. If you are not sure about a word, leave it as-is.\n\n" +
      "Return ONLY the cleaned text, no explanations, no markdown, no JSON.";

    const userPrompt =
      "Original job-site note text:\n\n" +
      text +
      "\n\nCleaned-up version (apply the strict rules above):";

    const output = await replicate.run("openai/gpt-5-nano", {
      input: {
        prompt: userPrompt,
        system_prompt: systemPrompt,
        reasoning_effort: "minimal",
        verbosity: "low",
        max_completion_tokens: 2000,
        temperature: 0.1,
      },
    });

    let cleaned = "";
    if (Array.isArray(output)) {
      cleaned = output.join("");
    } else if (typeof output === "string") {
      cleaned = output;
    } else {
      cleaned = String(output);
    }

    cleaned = cleaned.trim();

    return NextResponse.json({ cleaned });
  } catch (error) {
    console.error("Clean note error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to clean note with AI",
      },
      { status: 500 }
    );
  }
}


