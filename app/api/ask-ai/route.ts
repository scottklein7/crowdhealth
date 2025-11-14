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

    // Build context from database data only
    const context = `
CAMPAIGN INFORMATION:
- Campaign ID: ${campaign.id}
- Goal Amount: $${campaign.goal_amount}
- Amount Raised: $${campaign.amount_raised}
- Is Funded: ${campaign.is_funded}
- Reason for Help: ${campaign.reason || "Not provided"}
- Created: ${campaign.created_at}

MEDICAL BILL INFORMATION:
- Patient Name: ${bill?.patient_name || "Not available"}
- Patient DOB: ${bill?.patient_dob || "Not available"}
- Provider Name: ${bill?.provider_name || "Not available"}
- Provider Address: ${bill?.provider_address || "Not available"}
- Service Date: ${bill?.service_date || "Not available"}
- Total Amount: $${bill?.total_amount || "Not available"}
- Items: ${bill?.items ? JSON.stringify(bill.items, null, 2) : "Not available"}
`;

    const systemPrompt = `You are a helpful assistant that provides information about crowdfunding campaigns for medical bills. 

CRITICAL RULES:
1. ONLY use the information provided in the context below
2. DO NOT make up, infer, or assume any information not explicitly in the database
3. If information is not available in the context, say "This information is not available in the campaign data"
4. Stay strictly within the bounds of the provided database information
5. Be helpful and clear, but never speculate or add details not in the data
6. Focus on answering questions about the patient's situation, the medical bill, and the campaign status

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

