"use server";

import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function processOCR(
  image: string, // base64 data URL
  taskType: string = "Convert to Markdown",
  resolutionSize: string = "Gundam (Recommended)"
) {
  try {
    if (!image) {
      return { error: "Image is required" };
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      return { error: "REPLICATE_API_TOKEN is not configured" };
    }

    // Convert base64 data URL to Buffer
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    
    // Upload file to Replicate - the SDK handles the upload automatically
    const uploadedFile = await replicate.files.create(buffer);

    // Use the uploaded file URL for OCR
    const imageUrl = uploadedFile.urls.get;
    
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

    return { result: typeof output === "string" ? output : String(output) };
  } catch (error) {
    console.error("OCR processing error:", error);
    return { 
      error: error instanceof Error ? error.message : "Failed to process OCR" 
    };
  }
}

