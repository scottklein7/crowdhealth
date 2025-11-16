import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

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

        return NextResponse.json({
            result: ocrText,
            // Echo back any optional context for debugging/future use, but do not store it
            meta: {
              reason,
            },
        });
    } catch (error) {
        console.error("OCR processing error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to process OCR" },
            { status: 500 }
        );
    }
}

