import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";
import { supabaseAdmin } from "@/lib/supabase";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaignId, query } = body;

    if (!campaignId || !query) {
      return NextResponse.json(
        { error: "Campaign ID and query are required" },
        { status: 400 }
      );
    }

    // Fetch campaign and medical bill data
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from("crowdfunding_campaigns")
      .select(`
        *,
        medical_bills (
          patient_name,
          patient_dob,
          provider_name,
          provider_address,
          service_date,
          total_amount,
          items,
          raw_ocr_text,
          structured_data
        )
      `)
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    const bill = campaign.medical_bills;

    // Build context from database data only - be explicit about what exists
    const itemsData = bill?.items && Array.isArray(bill.items) && bill.items.length > 0
      ? JSON.stringify(bill.items, null, 2)
      : "No line items available in database";
    
    const context = `
CAMPAIGN INFORMATION (from database):
- Campaign ID: ${campaign.id}
- Goal Amount: $${campaign.goal_amount}
- Amount Raised: $${campaign.amount_raised}
- Is Funded: ${campaign.is_funded ? "Yes" : "No"}
- Reason for Help: ${campaign.reason || "[No reason provided]"}
- Created: ${campaign.created_at}

MEDICAL BILL INFORMATION (from database):
- Patient Name: ${bill?.patient_name || "[Not in database]"}
- Patient DOB: ${bill?.patient_dob || "[Not in database]"}
- Provider Name: ${bill?.provider_name || "[Not in database]"}
- Provider Address: ${bill?.provider_address || "[Not in database]"}
- Service Date: ${bill?.service_date || "[Not in database]"}
- Total Amount: $${bill?.total_amount || "[Not in database]"}
- Line Items: ${itemsData}
`;

    const systemPrompt = `You are a factual information assistant for medical bill crowdfunding campaigns. Your ONLY job is to report exactly what is in the database - nothing more, nothing less.

ABSOLUTE RULES - NO EXCEPTIONS:
1. ONLY state facts that are explicitly written in the context below
2. NEVER infer, assume, or add details not explicitly stated
3. NEVER combine information from different fields to create new facts
4. If asked about something not in the context, respond: "This information is not available in the campaign data"
5. If the items field shows "No line items available", do NOT describe what services were provided
6. If a date is shown, use it exactly as provided - do not interpret or add context
7. Do NOT summarize or rephrase the reason field - quote it directly if relevant
8. ALWAYS structure your response in an organized, easy-to-read format

RESPONSE FORMATTING REQUIREMENTS:
- Use clear sections with headers (## for main sections, ### for subsections)
- Use bullet points for lists of information
- Group related information together
- Use bold text for key facts (e.g., **Patient Name:** Sarah Thompson)
- Keep responses concise but well-organized
- If presenting multiple pieces of information, use a structured format like:

## Campaign Status
- **Goal Amount:** $X
- **Amount Raised:** $Y
- **Progress:** Z%

## Patient Information
- **Name:** [from database]
- **Service Date:** [from database]

Example of what NOT to do:
- If items are "No line items available", do NOT say "office visit and lab tests"
- If reason mentions "appendectomy", do NOT add details about what that involves
- Only state: "The reason provided is: [exact text from reason field]"

Context:
${context}`;

    const userPrompt = `Based on the campaign and medical bill data provided, answer this question: ${query}`;

    // Create a streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const output = await replicate.run(
            "openai/gpt-5-nano",
            {
              input: {
                prompt: userPrompt,
                system_prompt: systemPrompt,
                reasoning_effort: "minimal",
                verbosity: "medium",
                max_completion_tokens: 1000,
              },
            }
          );

          // Stream the output
          if (Array.isArray(output)) {
            for (const chunk of output) {
              const text = typeof chunk === "string" ? chunk : String(chunk);
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          } else {
            const text = typeof output === "string" ? output : String(output);
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`));
          }

          controller.enqueue(new TextEncoder().encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (error) {
          console.error("AI streaming error:", error);
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({ error: "Failed to get AI response" })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Ask AI error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process request" },
      { status: 500 }
    );
  }
}

