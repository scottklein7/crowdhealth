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
      "Your job is to transform messy contractor handwriting and OCR errors into clean, well-organized, professional text.\n\n" +
      "CRITICAL RULES:\n" +
      "1. Do NOT invent, add, or remove information that is not in the original text.\n" +
      "2. Preserve all numbers, measurements, dates, and dollar amounts exactly as written.\n" +
      "3. Organize the text into proper paragraphs with correct grammar, spelling, and punctuation.\n" +
      "4. Fix all spelling mistakes, duplicate words, and OCR errors.\n" +
      "5. Fix contractor shorthand and abbreviations when the meaning is clear.\n" +
      "6. Use proper capitalization, punctuation, and sentence structure.\n" +
      "7. Group related information into logical paragraphs.\n" +
      "8. If a word is unclear or ambiguous, leave it as-is rather than guessing.\n\n" +
      "Return ONLY the cleaned, organized text in paragraph form. No explanations, no markdown, no JSON.";

    const userPrompt =
      "Transform this job-site note into clean, well-organized text with proper grammar, spelling, and punctuation. Organize it into paragraphs. Keep all numbers, measurements, and dollar amounts exactly as written:\n\n" +
      text;

    const output = await replicate.run("openai/gpt-5-nano", {
      input: {
        prompt: userPrompt,
        system_prompt: systemPrompt,
        reasoning_effort: "minimal",
        verbosity: "low",
        max_completion_tokens: 3000,
        temperature: 0.4,
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


