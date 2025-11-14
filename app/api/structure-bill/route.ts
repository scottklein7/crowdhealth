import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

export const maxDuration = 300;

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

interface StructuredBillData {
  patient_name?: string;
  patient_dob?: string;
  provider_name?: string;
  provider_address?: string;
  service_date?: string;
  total_amount?: number;
  items?: Array<{
    description: string;
    amount: number;
    date?: string;
  }>;
  billing_address?: string;
  account_number?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ocrText } = body;

    if (!ocrText) {
      return NextResponse.json({ error: "OCR text is required" }, { status: 400 });
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json({ error: "REPLICATE_API_TOKEN is not configured" }, { status: 500 });
    }

    // Use a language model to structure the OCR data
    const prompt = `You are a medical bill data extraction specialist. Extract structured information from the following OCR text from a medical bill. Return ONLY valid JSON with no additional text.

Required fields to extract:
- patient_name: Full name of the patient
- patient_dob: Date of birth (format: YYYY-MM-DD or null if not found)
- provider_name: Name of the medical provider/facility
- provider_address: Address of the provider
- service_date: Date of service (format: YYYY-MM-DD or null if not found)
- total_amount: Total amount due as a number (null if not found)
- items: Array of line items with description, amount, and optional date
- billing_address: Billing address if different from provider
- account_number: Account or reference number if available


OCR Text:
${ocrText}

Return valid JSON only:`;

    // Use GPT-5-nano for fast, cost-effective structured output
    const output = await replicate.run(
      "openai/gpt-5-nano",
      {
        input: {
          prompt: prompt,
          system_prompt: "You are a JSON extraction specialist. Always return valid JSON only, no markdown, no explanations, no code blocks.",
          reasoning_effort: "minimal",
          verbosity: "low",
          max_completion_tokens: 2000,
        },
      }
    );

    // Parse the output - it might be an array of strings
    let jsonString = "";
    if (Array.isArray(output)) {
      jsonString = output.join("");
    } else if (typeof output === "string") {
      jsonString = output;
    } else {
      jsonString = String(output);
    }

    // Clean up the JSON string (remove markdown code blocks if present)
    jsonString = jsonString.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let structuredData: StructuredBillData;
    try {
      structuredData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Failed to parse JSON:", jsonString);
      return NextResponse.json(
        { error: "Failed to parse structured data from AI model" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      structured: structuredData,
    });
  } catch (error) {
    console.error("Structure bill error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to structure bill data" },
      { status: 500 }
    );
  }
}

