"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AIChatModalProps {
  campaignId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AIChatModal({ campaignId, isOpen, onClose }: AIChatModalProps) {
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add welcome message
      setMessages([
        {
          role: "assistant",
          content: "Hello! I can help answer questions about this crowdfunding campaign and medical bill. What would you like to know?",
        },
      ]);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/ask-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaignId,
          query: userMessage,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      if (reader) {
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") {
                setIsLoading(false);
                return;
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  assistantMessage += parsed.text;
                  setMessages((prev) => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = {
                      role: "assistant",
                      content: assistantMessage,
                    };
                    return newMessages;
                  });
                } else if (parsed.error) {
                  throw new Error(parsed.error);
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderMarkdown = (text: string) => {
    // Split by lines to process markdown
    const lines = text.split("\n");
    const elements: React.ReactElement[] = [];
    let currentList: string[] = [];
    let key = 0;

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={key++} className="list-disc list-inside space-y-1 my-2">
            {currentList.map((item, idx) => {
              const parts = item.split(/(\*\*.*?\*\*)/g);
              const formattedContent = parts.map((part, partIdx) => {
                if (part.startsWith("**") && part.endsWith("**")) {
                  return <strong key={partIdx}>{part.slice(2, -2)}</strong>;
                }
                return part;
              });
              return (
                <li key={idx} className="text-sm">
                  {formattedContent}
                </li>
              );
            })}
          </ul>
        );
        currentList = [];
      }
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Headers
      if (trimmed.startsWith("### ")) {
        flushList();
        elements.push(
          <h3 key={key++} className="text-base font-semibold mt-3 mb-2">
            {trimmed.slice(4)}
          </h3>
        );
      } else if (trimmed.startsWith("## ")) {
        flushList();
        elements.push(
          <h2 key={key++} className="text-lg font-bold mt-4 mb-2">
            {trimmed.slice(3)}
          </h2>
        );
      } else if (trimmed.startsWith("# ")) {
        flushList();
        elements.push(
          <h1 key={key++} className="text-xl font-bold mt-4 mb-2">
            {trimmed.slice(2)}
          </h1>
        );
      }
      // Bullet points
      else if (trimmed.startsWith("- ")) {
        const content = trimmed.slice(2);
        currentList.push(content);
      }
      // Regular paragraphs with bold
      else if (trimmed) {
        flushList();
        const parts = trimmed.split(/(\*\*.*?\*\*)/g);
        const formattedContent = parts.map((part, partIdx) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={partIdx}>{part.slice(2, -2)}</strong>;
          }
          return part;
        });
        elements.push(
          <p key={key++} className="text-sm my-1">
            {formattedContent}
          </p>
        );
      } else {
        // Empty line - flush list and add spacing
        flushList();
        if (idx < lines.length - 1) {
          elements.push(<br key={key++} />);
        }
      }
    });

    flushList();

    return <div>{elements}</div>;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-2xl h-[600px] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>Ask AI about this campaign</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
          {/* Messages */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto space-y-4 pr-2"
          >
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-2",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {message.role === "assistant" ? (
                    <div className="text-sm prose prose-sm max-w-none">
                      {renderMarkdown(message.content)}
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2 border-t pt-4">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about this campaign..."
              className="flex-1 min-h-[60px] max-h-[120px] px-3 py-2 text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={isLoading}
            />
            <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

