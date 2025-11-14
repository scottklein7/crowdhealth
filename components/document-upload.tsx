"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, X, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DocumentUploadProps {
  onFileSelect?: (file: File) => void;
}

export function DocumentUpload({ onFileSelect }: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState<string>("");

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith("image/")) {
      setFile(droppedFile);
      onFileSelect?.(droppedFile);
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      setFile(selectedFile);
      onFileSelect?.(selectedFile);
    }
  }, [onFileSelect]);

  const handleRemove = useCallback(() => {
    setFile(null);
    setOcrResult(null);
    setError(null);
    setReason("");
  }, []);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleProcess = useCallback(async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setOcrResult(null);

    try {
      const base64Image = await fileToBase64(file);

      const response = await fetch("/api/ocr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: base64Image,
          taskType: "Free OCR",
          resolutionSize: "Gundam (Recommended)",
          reason: reason.trim() || null,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        setError(result.error || "Failed to process OCR");
      } else if (result.result) {
        setOcrResult(result.result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsProcessing(false);
    }
  }, [file, reason]);

  return (
    <Card className="w-full max-w-2xl">
      <CardContent className="p-8">
        {!file ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-lg p-12 text-center transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            )}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-primary/10 p-4">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                  Upload your medical bill
                </h3>
                <p className="text-sm text-muted-foreground">
                  Drag and drop an image here, or click to browse
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
              />
              <Button
                asChild
                variant="outline"
                className="mt-2"
              >
                <label htmlFor="file-upload" className="cursor-pointer">
                  Select File
                </label>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRemove}
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
              <div>
                <label htmlFor="reason" className="text-sm font-medium mb-2 block">
                  Why do you need help with this medical bill? <span className="text-muted-foreground">(Optional)</span>
                </label>
                <textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please explain your situation and why you need crowdfunding support..."
                  className="w-full min-h-[100px] px-3 py-2 text-sm border rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={isProcessing}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleRemove}
                variant="outline"
                className="flex-1"
                disabled={isProcessing}
              >
                Remove
              </Button>
              <Button 
                className="flex-1"
                onClick={handleProcess}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Process Document"
                )}
              </Button>
            </div>
            {error && (
              <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/10">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
            {ocrResult && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium">Document processed successfully</span>
                </div>
                <Card className="border-2">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold">Extracted Text:</h3>
                      <div className="max-h-96 overflow-y-auto p-4 bg-muted rounded-lg">
                        <pre className="text-xs whitespace-pre-wrap font-mono">
                          {ocrResult}
                        </pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


