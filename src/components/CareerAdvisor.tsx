import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, RefreshCw, HelpCircle, ArrowRight, CornerDownLeft, AlertCircle, Lightbulb } from "lucide-react";
import { ChatMessage } from "../types";

const QUICK_PROMPTS = [
  "What are typical salary bands in Zambia?",
  "How do I register with ZICA as an accountant?",
  "What qualifications do open-pit mines look for?",
  "List the top CV mistakes in Zambia & how to fix them."
];

export default function CareerAdvisor() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      message: "Muli bwanji! I am Bantu, your CareerLink Career Advisor. I specialize in the Zambian professional landscape. Whether you are wondering about copperbelt mine requirements, Zanaco banking bands, ZICA/EIZ licenses, or simply how to structure your cover letter, ask away! How can I assist you in your career acceleration today?",
      timestamp: new Date()
    }
  ]);
  const [userInput, setUserInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  // Handle message send
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMessage: ChatMessage = {
      id: "user-" + Math.random().toString(36).substr(2, 9),
      role: "user",
      message: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setUserInput("");
    setSending(true);
    setError(null);

    try {
      // Map message history to simple roles
      const messageHistory = messages.map(msg => ({
        role: msg.role,
        message: msg.message
      }));
      messageHistory.push({
        role: "user",
        message: textToSend
      });

      const res = await fetch("/api/career/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messageHistory })
      });

      if (!res.ok) {
        throw new Error("I had a small connection lag. Ensure your API keys are registered in the sidebar Secrets panels.");
      }

      const data = await res.json();

      const replyMessage: ChatMessage = {
        id: "reply-" + Math.random().toString(36).substr(2, 9),
        role: "assistant",
        message: data.reply,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, replyMessage]);
    } catch (err: any) {
      setError(err.message || "Failed to get reply from Bantu.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6" id="career-advisor-tab">
      {/* Tab intro */}
      <div className="border-b border-brand-border pb-4">
        <h2 className="text-2xl font-display font-bold text-brand-green flex items-center space-x-2">
          <MessageSquare className="h-6 w-6 text-brand-orange" />
          <span>Talk to Bantu - Career Advisor</span>
        </h2>
        <p className="text-xs text-brand-text-dim font-semibold mt-0.5">
          Ask questions, receive localized career guidance, and get expert guidance on salary negotiations, local certifications, and interview preparation.
        </p>
      </div>

      {/* Chat workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[600px]">
        {/* Chat window panel */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-brand-border shadow-xs flex flex-col h-full overflow-hidden">
          {/* Header status bar */}
          <div className="bg-brand-green text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-white/10 border border-white/20 text-brand-orange-light flex items-center justify-center font-extrabold shadow-sm animate-pulse">
                B
              </div>
              <div>
                <h3 className="text-sm font-display font-bold tracking-wide">Bantu Advisor</h3>
                <span className="text-[10px] text-brand-orange-light font-bold flex items-center">
                  <span className="h-1.5 w-1.5 bg-brand-orange rounded-full mr-1.5 animate-ping" />
                  <span>Online Advisor</span>
                </span>
              </div>
            </div>
            <span className="text-[10px] bg-brand-orange/20 text-brand-orange-light font-bold px-2 py-0.5 rounded-full border border-brand-orange/30 font-mono">
              Bantu Engine Active
            </span>
          </div>

          {/* Messages stream */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-brand-bg-alt/30 scrollbar-thin">
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex ${isUser ? "justify-end" : "justify-start"} items-end space-x-2`}
                >
                  {!isUser && (
                    <div className="h-7 w-7 rounded-full bg-brand-green text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 shadow-sm border border-brand-green-dark">
                      B
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] p-4 rounded-2xl shadow-xs border ${
                      isUser
                        ? "bg-brand-green border-brand-green text-white rounded-br-none"
                        : "bg-white border-brand-border text-brand-text rounded-bl-none"
                    }`}
                  >
                    <p className="text-xs font-semibold leading-relaxed whitespace-pre-wrap">
                      {msg.message}
                    </p>
                    <span className={`text-[9px] block text-right mt-1.5 font-semibold ${isUser ? "text-brand-orange-light" : "text-brand-text-dim"}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              );
            })}

            {sending && (
              <div className="flex justify-start items-end space-x-2">
                <div className="h-7 w-7 rounded-full bg-brand-green text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 shadow-sm">
                  B
                </div>
                <div className="bg-white border border-brand-border p-4 rounded-2xl rounded-bl-none shadow-xs">
                  <div className="flex space-x-1.5 items-center py-1">
                    <span className="h-1.5 w-1.5 bg-brand-green rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 bg-brand-green rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 bg-brand-green rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start space-x-2 text-xs text-red-800">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat input box */}
          <div className="border-t border-brand-border p-4 bg-white">
            <div className="relative flex items-center border border-brand-border rounded-xl bg-brand-bg-alt/40 focus-within:border-brand-green focus-within:bg-white p-1">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && userInput.trim() && !sending) {
                    handleSendMessage(userInput);
                  }
                }}
                disabled={sending}
                placeholder="Ask Bantu anything about Zambian careers, salaries, cv reviews..."
                className="w-full text-xs text-brand-text placeholder-brand-text-dim bg-transparent px-3 py-3 focus:outline-none font-semibold"
              />
              <button
                onClick={() => handleSendMessage(userInput)}
                disabled={sending || !userInput.trim()}
                className="bg-brand-green hover:bg-brand-green-dark text-white p-2.5 rounded-lg shadow-xs disabled:opacity-35 transition-all flex items-center justify-center"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="flex justify-between items-center text-[10px] text-brand-text-dim font-bold px-1.5 pt-2">
              <span>Press enter to transmit message</span>
              <span className="flex items-center">
                <CornerDownLeft className="h-3.5 w-3.5 mr-0.5 text-brand-orange" />
                <span>Line breaks: Shift + Enter</span>
              </span>
            </div>
          </div>
        </div>

        {/* Suggestion triggers column (Right) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-brand-border shadow-xs p-5 space-y-4">
            <h4 className="text-xs font-black text-brand-green uppercase tracking-wider flex items-center space-x-1.5">
              <HelpCircle className="h-4 w-4 text-brand-orange" />
              <span>Recommended Starters</span>
            </h4>
            <p className="text-[11px] text-brand-text-dim font-medium">
              Click any option below to instantly request professional guidance regarding common local scenarios:
            </p>

            <div className="space-y-2">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (!sending) handleSendMessage(prompt);
                  }}
                  disabled={sending}
                  className="w-full text-left text-xs text-brand-text font-semibold bg-brand-bg-alt/40 hover:bg-brand-green/5 hover:text-brand-green border border-brand-border hover:border-brand-green/20 p-3 rounded-xl transition-all flex items-center justify-between"
                >
                  <span>{prompt}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-brand-text-dim flex-shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-brand-green text-white rounded-2xl p-5 space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-16 w-16 bg-brand-orange/15 rounded-full blur-xl" />
            <h4 className="text-xs font-black text-brand-orange-light uppercase tracking-wider flex items-center space-x-1.5">
              <Lightbulb className="h-4 w-4 text-brand-orange-light" />
              <span>Personalized Resume Review</span>
            </h4>
            <p className="text-[11px] text-brand-bg-alt leading-relaxed font-semibold">
              Bantu is connected straight to your optimizer. If you ever need Bantu to review your detailed resume and discuss recommendations interactively, simply copy-paste parts here!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
