import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";
import { saveMedicalBill } from "@/lib/supabase";

// Allow up to 5 minutes for OCR processing
export const maxDuration = 300;

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        // Support both camelCase (from component) and snake_case (API format)
        const taskType = body.taskType || body.task_type || "Free OCR";
        const resolutionSize = body.resolutionSize || body.resolution_size || "Gundam (Recommended)";
        const { image } = body;
        // Extract reason - handle empty strings, null, undefined
        const reason = body.reason && typeof body.reason === 'string' && body.reason.trim() 
          ? body.reason.trim() 
          : null;

        if (!image) {
            return NextResponse.json({ error: "Image is required" }, { status: 400 });
        }

        if (!process.env.REPLICATE_API_TOKEN) {
            return NextResponse.json({ error: "REPLICATE_API_TOKEN is not configured" }, { status: 500 });
        }

        // Convert base64 data URL to Buffer
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");

        // Upload file to Replicate
        const uploadedFile = await replicate.files.create(buffer);
        const imageUrl = uploadedFile.urls.get;

        // Run OCR
        const output = await replicate.run(
            "lucataco/deepseek-ocr:cb3b474fbfc56b1664c8c7841550bccecbe7b74c30e45ce938ffca1180b4dff5",
            {
                input: {
                    image: imageUrl,
                    task_type: taskType,
                    resolution_size: resolutionSize,
                },
            }
        );

        const ocrText = typeof output === "string" ? output : String(output);

        // Debug: Log the reason received
        console.log("Reason received from request:", reason);

        // Optionally structure and save to Supabase
        const shouldStructure = body.structure !== false; // Default to true
        let structuredData = null;
        let savedBill = null;

        if (shouldStructure) {
            try {
                // Structure the OCR data using AI
                const structureResponse = await fetch(
                    `${request.nextUrl.origin}/api/structure-bill`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ ocrText }),
                    }
                );

                if (structureResponse.ok) {
                    const structureResult = await structureResponse.json();
                    structuredData = structureResult.structured;

                    // Save to Supabase with reason
                    console.log("Saving bill with reason:", reason);
                    savedBill = await saveMedicalBill(ocrText, structuredData, reason || null);
                }
            } catch (structureError) {
                console.error("Failed to structure or save bill:", structureError);
                // Continue even if structuring fails - still return OCR text
            }
        }

        return NextResponse.json({
            result: ocrText,
            structured: structuredData,
            saved: savedBill ? { id: savedBill.id } : null,
        });
    } catch (error) {
        console.error("OCR processing error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to process OCR" },
            { status: 500 }
        );
    }
}

