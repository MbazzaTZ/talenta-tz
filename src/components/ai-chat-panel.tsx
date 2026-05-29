import * as React from "react";
import { MessageCircle, X, Send, Loader2, Upload, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { aiChat, aiChatWithFile } from "@/lib/ai";
import { extractTextFromFile } from "@/lib/file-extract";

type Message = { role: "user" | "assistant"; content: string; hasFile?: boolean };

export function AIChatPanel() {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm Talentra's AI assistant. I can help you with job search advice, CV tips, interview prep, or anything else about your career. You can also upload images or documents for me to analyze. What would you like help with?",
    },
  ]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [filePreview, setFilePreview] = React.useState<string>("");
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File | undefined) => {
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large (max 5 MB)");
      return;
    }

    setSelectedFile(file);

    // Show preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(`📄 ${file.name}`);
    }
  };

  const handleSend = async () => {
    if (!input.trim() && !selectedFile) return;

    const userMsg = input.trim() || "Please analyze this file";
    setInput("");

    // Add user message to chat
    setMessages((m) => [
      ...m,
      {
        role: "user",
        content: selectedFile ? `📎 ${selectedFile.name}: ${userMsg}` : userMsg,
        hasFile: !!selectedFile,
      },
    ]);

    setLoading(true);

    try {
      let response: string;

      if (selectedFile) {
        // File-based chat
        const isImage = selectedFile.type.startsWith("image/");

        if (isImage) {
          // Convert image to base64
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve((e.target?.result as string).split(",")[1]);
            reader.readAsDataURL(selectedFile);
          });
          response = await aiChatWithFile(userMsg, "image", base64, selectedFile.name);
        } else {
          // Extract text from document
          try {
            const { text } = await extractTextFromFile(selectedFile);
            response = await aiChatWithFile(
              userMsg,
              "document",
              text,
              selectedFile.name,
            );
          } catch (e) {
            throw new Error(
              `Could not read file: ${e instanceof Error ? e.message : "unknown error"}`,
            );
          }
        }

        setSelectedFile(null);
        setFilePreview("");
      } else {
        // Regular chat
        response = await aiChat([
          ...messages,
          { role: "user", content: userMsg },
        ]);
      }

      setMessages((m) => [...m, { role: "assistant", content: response }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to get response";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-accent text-accent-foreground shadow-lg hover:bg-accent/90 flex items-center justify-center transition-colors z-40"
          aria-label="Open AI Chat"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-0 right-0 w-full sm:w-96 h-screen sm:h-[600px] bg-background border-l shadow-xl flex flex-col z-50 rounded-t-lg sm:rounded-lg">
          {/* Header */}
          <div className="border-b p-4 flex items-center justify-between bg-muted/30">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <h3 className="font-semibold">Talentra AI Assistant</h3>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 hover:bg-muted rounded-md transition-colors"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4 space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                    msg.role === "user"
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Thinking...
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </ScrollArea>

          {/* File preview */}
          {selectedFile && (
            <div className="border-t bg-muted/20 p-3">
              <div className="flex items-center justify-between gap-2 text-sm">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {filePreview.startsWith("data:") ? (
                    <img
                      src={filePreview}
                      alt="preview"
                      className="h-8 w-8 rounded object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="truncate text-xs text-muted-foreground">
                    {selectedFile.name}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setFilePreview("");
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t p-4 space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.docx,.doc,.txt"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
            />

            <div className="flex gap-2">
              <Input
                placeholder={
                  selectedFile
                    ? "Add a message about this file..."
                    : "Ask me anything..."
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                disabled={loading}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                variant="outline"
                size="icon"
              >
                <Upload className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleSend}
                disabled={loading || (!input.trim() && !selectedFile)}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Upload images, PDFs, or documents. Max 5 MB.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
