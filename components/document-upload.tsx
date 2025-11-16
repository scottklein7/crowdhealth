"use client";

import { useState, useCallback, useEffect } from "react";
import { Upload, FileText, X, Loader2, CheckCircle2, Sparkles, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const UPLOAD_PASSWORD = process.env.NEXT_PUBLIC_UPLOAD_PASSWORD || "nautilus";

interface DocumentUploadProps {
  onFileSelect?: (file: File) => void;
}

export function DocumentUpload({ onFileSelect }: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<string | null>(null);
  const [cleanedResult, setCleanedResult] = useState<string | null>(null);
  const [isCleaning, setIsCleaning] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [copied, setCopied] = useState<"original" | "cleaned" | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [hasEnteredPassword, setHasEnteredPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
      setTitle(droppedFile.name.replace(/\.[^/.]+$/, "") || "");
      onFileSelect?.(droppedFile);
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      setFile(selectedFile);
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, "") || "");
      onFileSelect?.(selectedFile);
    }
  }, [onFileSelect]);

  const handleRemove = useCallback(() => {
    setFile(null);
    setOcrResult(null);
    setCleanedResult(null);
    setCopied(null);
    setError(null);
    setReason("");
    setTitle("");
    setHasEnteredPassword(false);
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
        setCleanedResult(null);
        setIsDialogOpen(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsProcessing(false);
    }
  }, [file, reason]);

  useEffect(() => {
    if (!file) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const handlePasswordSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (passwordInput === UPLOAD_PASSWORD) {
        setHasEnteredPassword(true);
        setPasswordError(null);
        setPasswordInput("");
        setIsPasswordDialogOpen(false);
        void handleProcess();
      } else {
        setPasswordError("Incorrect password. Please try again.");
      }
    },
    [passwordInput, handleProcess]
  );

  const handleProcessClick = useCallback(() => {
    if (!file) return;
    if (!hasEnteredPassword) {
      setIsPasswordDialogOpen(true);
      return;
    }
    void handleProcess();
  }, [file, hasEnteredPassword, handleProcess]);

  const handleCleanWithAI = useCallback(async () => {
    if (!ocrResult || isCleaning) return;

    setIsCleaning(true);
    setError(null);

    try {
      const response = await fetch("/api/clean-note", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: ocrResult }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        setError(result.error || "Failed to clean note with AI");
      } else if (result.cleaned) {
        setCleanedResult(result.cleaned);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An error occurred while cleaning"
      );
    } finally {
      setIsCleaning(false);
    }
  }, [ocrResult, isCleaning]);

  const handleCopy = useCallback(
    async (variant: "original" | "cleaned") => {
      const textToCopy =
        variant === "cleaned" ? cleanedResult || "" : ocrResult || "";
      if (!textToCopy) return;

      try {
        await navigator.clipboard.writeText(textToCopy);
        setCopied(variant);
        setTimeout(() => setCopied((prev) => (prev === variant ? null : prev)), 2000);
      } catch (err) {
        console.error("Failed to copy text:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to copy text. Please copy manually."
        );
      }
    },
    [ocrResult, cleanedResult]
  );

  return (
    <>
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
                  Upload a job-site note
                </h3>
                <p className="text-sm text-muted-foreground">
                  Drag and drop a clear photo of a handwritten page, or click to browse
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
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium block">
                  Document title
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Lot 14 – framing punchlist"
                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={isProcessing}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="reason" className="text-sm font-medium mb-2 block">
                  Extra context for this job{" "}
                  <span className="text-muted-foreground">(Optional)</span>
                </label>
                <textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Lot number, client name, crew on site, or anything you want attached to this note..."
                  className="w-full min-h-[100px] px-3 py-2 text-sm border rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={isProcessing}
                />
              </div>
              {previewUrl && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Uploaded image
                  </p>
                  <div className="overflow-hidden rounded-md border bg-muted/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt={title || file?.name || "Uploaded note"}
                      className="max-h-80 w-full object-contain bg-black/5"
                    />
                  </div>
                </div>
              )}
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
                onClick={handleProcessClick}
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
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="font-medium">
                      Document processed successfully
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDialogOpen(true)}
                  >
                    View text
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
        </CardContent>
      </Card>

      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Enter access password</DialogTitle>
            <DialogDescription>
              This step helps prevent automated spam. Ask the team for the current password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (passwordError) setPasswordError(null);
                }}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Password"
                autoFocus
              />
              {passwordError && (
                <p className="text-xs text-destructive">{passwordError}</p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsPasswordDialogOpen(false);
                  setPasswordInput("");
                  setPasswordError(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                Continue
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader className="flex flex-row items-center justify-between gap-6">
            <div>
              <DialogTitle className="mb-3 text-xl md:text-2xl">OCR result</DialogTitle>
              <DialogDescription className="text-sm md:text-base">
                Review the raw text from your job-site note. Optionally let
                Nautilus NoteDesk gently clean up spelling and grammar.
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCleanWithAI}
              disabled={!ocrResult || isCleaning}
            >
              {isCleaning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cleaning…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Clean with AI
                </>
              )}
            </Button>
          </DialogHeader>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Original text
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy("original")}
                  disabled={!ocrResult}
                >
                  <Copy className="h-4 w-4 mr-1.5" />
                  {copied === "original" ? "Copied" : "Copy"}
                </Button>
              </div>
              <div className="max-h-112 overflow-y-auto rounded-md border bg-muted/60 p-4">
                <pre className="text-sm md:text-base whitespace-pre-wrap font-mono leading-relaxed">
                  {reason.trim()
                    ? `Additional text you added to this note: ${reason.trim()}\n\n${ocrResult ?? ""}`
                    : ocrResult}
                </pre>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  {cleanedResult ? "Cleaned text" : "Cleaned text (pending)"}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy("cleaned")}
                  disabled={!cleanedResult}
                >
                  <Copy className="h-4 w-4 mr-1.5" />
                  {copied === "cleaned" ? "Copied" : "Copy"}
                </Button>
              </div>
              <div className="max-h-112 overflow-y-auto rounded-md border bg-muted/40 p-4">
                <pre className="text-sm md:text-base whitespace-pre-wrap font-mono leading-relaxed">
                  {cleanedResult ||
                    "Run “Clean with AI” to generate a lightly edited version of this note."}
                </pre>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}


