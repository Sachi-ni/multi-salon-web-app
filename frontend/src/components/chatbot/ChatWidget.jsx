import React, { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { sendChatMessage } from "../../services/chatService";
import "./ChatWidget.css";

/* ── Markdown-lite renderer (bold, italic, links, line breaks) ── */
function renderBotText(text) {
  if (!text) return null;

  return text.split("\n").map((line, i) => {
    const parts = [];
    let remaining = line;
    let key = 0;

    while (remaining.length > 0) {
      const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
      const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
      const italicMatch = remaining.match(/_([^_]+)_/);

      const matches = [];
      if (linkMatch) matches.push({ type: 'link', match: linkMatch, index: linkMatch.index });
      if (boldMatch) matches.push({ type: 'bold', match: boldMatch, index: boldMatch.index });
      if (italicMatch) matches.push({ type: 'italic', match: italicMatch, index: italicMatch.index });

      if (matches.length === 0) {
        parts.push(<span key={key++}>{remaining}</span>);
        remaining = "";
        break;
      }

      matches.sort((a, b) => a.index - b.index);
      const firstMatch = matches[0];

      if (firstMatch.index > 0) {
        parts.push(<span key={key++}>{remaining.slice(0, firstMatch.index)}</span>);
      }

      if (firstMatch.type === 'link') {
        const url = firstMatch.match[2];
        const linkText = firstMatch.match[1];
        const isInternal = url.startsWith("/");
        const linkStyle = { color: "#f5c800", fontWeight: 600, textDecoration: "underline" };
        
        if (isInternal) {
          parts.push(
            <Link key={key++} to={url} style={linkStyle}>
              {linkText}
            </Link>
          );
        } else {
          parts.push(
            <a key={key++} href={url} target="_blank" rel="noopener noreferrer" style={linkStyle}>
              {linkText}
            </a>
          );
        }
      } else if (firstMatch.type === 'bold') {
        parts.push(<strong key={key++}>{firstMatch.match[1]}</strong>);
      } else if (firstMatch.type === 'italic') {
        parts.push(<em key={key++}>{firstMatch.match[1]}</em>);
      }

      remaining = remaining.slice(firstMatch.index + firstMatch.match[0].length);
    }

    return (
      <React.Fragment key={i}>
        {parts}
        {i < text.split("\n").length - 1 && <br />}
      </React.Fragment>
    );
  });
}

/* ── Customer-facing routes where chatbot should appear ── */
const CUSTOMER_ROUTES = [
  "/",
  "/our-salons",
  "/our-services",
  "/team",
  "/login",
  "/register",
  "/customer",
  "/book",
  "/my-appointments",
];

function isCustomerRoute(pathname) {
  return CUSTOMER_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
}

/* ═══════════════════════════════════════ */
/*           CHAT WIDGET COMPONENT         */
/* ═══════════════════════════════════════ */
export default function ChatWidget() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= 640 : false
  );
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 640);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Prevent background scrolling on mobile when chat is open
  useEffect(() => {
    if (isOpen && isMobile) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, isMobile]);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  // Focus input when chat opens only on non-mobile devices to prevent mobile auto-zoom
  useEffect(() => {
    if (isOpen && !isMobile) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, isMobile]);

  // Send welcome message on first open
  useEffect(() => {
    if (isOpen && !hasGreeted) {
      setHasGreeted(true);
      setIsTyping(true);
      setTimeout(() => {
        setMessages([
          {
            from: "bot",
            text: "Hello! 👋 Welcome to **SalonHub**! I'm your virtual assistant. How can I help you today?",
            quickReplies: [
              "✨ Style Consultant",
              "Our Services",
              "Pricing",
              "Salon Locations",
              "Book Appointment",
              "Working Hours",
              "Contact Us",
            ],
          },
        ]);
        setIsTyping(false);
      }, 800);
    }
  }, [isOpen, hasGreeted]);

  // Send message
  const handleSend = async (text) => {
    const msgText = (text || input).trim();
    if (!msgText) return;

    // Add user message
    setMessages((prev) => [...prev, { from: "user", text: msgText }]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await sendChatMessage(msgText);
      const { reply, quickReplies } = res.data;

      // Simulate typing delay for realism
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { from: "bot", text: reply, quickReplies: quickReplies || [] },
        ]);
        setIsTyping(false);
      }, 600 + Math.random() * 400);
    } catch (err) {
      console.error("Chat error:", err);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            from: "bot",
            text: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
            quickReplies: ["Try Again"],
          },
        ]);
        setIsTyping(false);
      }, 500);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Only show on customer-facing routes
  if (!isCustomerRoute(location.pathname)) {
    return null;
  }

  return (
    <>
      {/* ── Floating Toggle Button ── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            className="chat-toggle"
            onClick={() => setIsOpen(true)}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            aria-label="Open chat"
          >
            <MessageCircle />
            <span className="chat-toggle-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Chat Window ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="chat-window"
            initial={
              isMobile
                ? { opacity: 0, y: "100%" }
                : { opacity: 0, scale: 0.85, y: 30 }
            }
            animate={
              isMobile
                ? { opacity: 1, y: 0 }
                : { opacity: 1, scale: 1, y: 0 }
            }
            exit={
              isMobile
                ? { opacity: 0, y: "100%" }
                : { opacity: 0, scale: 0.85, y: 30 }
            }
            transition={
              isMobile
                ? { type: "spring", damping: 28, stiffness: 300 }
                : { type: "spring", stiffness: 350, damping: 25 }
            }
          >
            {/* Header */}
            <div className="chat-header">
              <div className="chat-header-avatar">
                <Sparkles />
              </div>
              <div className="chat-header-info">
                <div className="chat-header-title">SalonHub Assistant</div>
                <div className="chat-header-status">
                  <span className="chat-header-status-dot" />
                  <span className="chat-header-status-text">Online</span>
                </div>
              </div>
              <button
                className="chat-close-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
              >
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div className="chat-messages">
              {messages.map((msg, i) => (
                <React.Fragment key={i}>
                  <div
                    className={`chat-msg ${
                      msg.from === "bot" ? "chat-msg-bot" : "chat-msg-user"
                    }`}
                  >
                    {msg.from === "bot" ? renderBotText(msg.text) : msg.text}
                  </div>
                  {/* Quick replies (only for last bot message or all) */}
                  {msg.from === "bot" &&
                    msg.quickReplies &&
                    msg.quickReplies.length > 0 &&
                    i === messages.length - 1 && (
                      <div className="chat-quick-replies">
                        {msg.quickReplies.map((qr, j) => (
                          <button
                            key={j}
                            className="chat-quick-btn"
                            onClick={() => handleSend(qr)}
                          >
                            {qr}
                          </button>
                        ))}
                      </div>
                    )}
                </React.Fragment>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="chat-typing">
                  <span className="chat-typing-dot" />
                  <span className="chat-typing-dot" />
                  <span className="chat-typing-dot" />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="chat-input-bar">
              <input
                ref={inputRef}
                className="chat-input"
                type="text"
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping}
              />
              <button
                className="chat-send-btn"
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping}
                aria-label="Send message"
              >
                <Send />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
