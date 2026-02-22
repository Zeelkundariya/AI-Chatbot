import { useState, useEffect, useRef } from "react";

export default function Chat({ token, setToken }) {
  const [msg, setMsg] = useState("");
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chats, loading]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const r = await fetch("http://localhost:8000/chats", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const d = await r.json();
        setChats(d.map(c => ({ u: c.user, b: c.bot })));
      } catch (e) {
        console.error("Failed to fetch history", e);
      }
    };
    fetchHistory();
  }, [token]);

  const send = async () => {
    if (!msg.trim() || loading) return;

    const userMsg = msg;
    setMsg("");
    setLoading(true);
    setError("");

    // Optimistic update
    setChats(prev => [...prev, { u: userMsg, b: "Thinking..." }]);

    try {
      const r = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: userMsg })
      });

      if (!r.ok) throw new Error("Failed to get response");

      const d = await r.json();

      setChats(prev => {
        const newChats = [...prev];
        newChats[newChats.length - 1].b = d.response;
        return newChats;
      });
    } catch (e) {
      setChats(prev => {
        const newChats = [...prev];
        newChats[newChats.length - 1].b = "⚠️ Sorry, I encountered an error. Please try again.";
        return newChats;
      });
      console.error("Chat failed", e);
    } finally {
      setLoading(false);
    }
  };

  const [quizSettings, setQuizSettings] = useState({ topic: "", count: 3 });
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [quizResult, setQuizResult] = useState(null);

  const generateQuiz = async () => {
    setLoading(true);
    setShowQuizModal(false);
    setActiveQuiz(null);
    setQuizResult(null);

    const requestMsg = `🎓 Quiz Request: ${quizSettings.topic || "General"} (${quizSettings.count} questions)`;
    setChats(prev => [...prev, { u: requestMsg, b: "Thinking..." }]);

    try {
      const url = new URL("http://localhost:8000/generate-quiz");
      if (quizSettings.topic) url.searchParams.append("topic", quizSettings.topic);
      url.searchParams.append("count", quizSettings.count);

      const r = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!r.ok) throw new Error("Quiz failure");
      const d = await r.json();

      let questions = [];
      try {
        const cleaned = d.quiz.replace(/```json|```/g, "").trim();
        questions = JSON.parse(cleaned);
      } catch (e) {
        throw new Error("I received an invalid quiz format. Please try again.");
      }

      setChats(prev => {
        const newChats = [...prev];
        newChats[newChats.length - 1].b = "✅ Quiz is ready! Starting your test now...";
        return newChats;
      });

      setActiveQuiz(questions);
      setQuizIndex(0);
      setUserAnswers([]);
    } catch (e) {
      setChats(prev => {
        const newChats = [...prev];
        newChats[newChats.length - 1].b = `⚠️ ${e.message}`;
        return newChats;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (option) => {
    const newAnswers = [...userAnswers, option];
    setUserAnswers(newAnswers);
    if (quizIndex < activeQuiz.length - 1) {
      setQuizIndex(quizIndex + 1);
    } else {
      calculateResults(newAnswers);
    }
  };

  const calculateResults = (answers) => {
    let score = 0;
    const summary = activeQuiz.map((q, i) => {
      const isCorrect = q.answer === answers[i];
      if (isCorrect) score++;
      return { ...q, userAnswer: answers[i], isCorrect };
    });
    setQuizResult({ score, total: activeQuiz.length, summary });
    setActiveQuiz(null);
  };

  return (
    <div className="container" style={{ height: "100vh", display: "flex", flexDirection: "column", padding: "1rem" }}>
      <nav style={{ padding: "0.5rem 0" }}>
        <h1 className="title" style={{ fontSize: "1.8rem" }}>Study Bot Elite</h1>
        <button onClick={() => setToken(null)} style={{ padding: "8px 20px", background: "rgba(239, 68, 68, 0.2)", color: "#ef4444", border: "1px solid #ef4444" }}>
          Sign Out
        </button>
      </nav>

      <div className="glass-card" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", marginTop: "1rem" }}>
        {/* Messages Area */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          <div style={{ alignSelf: "center", position: "sticky", top: 0, zIndex: 10 }}>
            <label className="glass-card" style={{ padding: "10px 20px", cursor: "pointer", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "10px", background: "var(--bg-card)", border: "1px solid var(--primary)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.48-8.48l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
              <span>{loading ? "Working..." : "📎 Upload Study PDF"}</span>
              <input
                type="file"
                accept=".pdf"
                style={{ display: "none" }}
                disabled={loading}
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  setLoading(true);
                  const formData = new FormData();
                  formData.append("file", file);
                  try {
                    const r = await fetch("http://localhost:8000/upload-pdf", {
                      method: "POST",
                      headers: { "Authorization": `Bearer ${token}` },
                      body: formData
                    });
                    if (!r.ok) throw new Error("Upload failed");
                    alert("✅ PDF successfully indexed!");
                  } catch (err) {
                    alert("❌ Upload failed. Please try again.");
                  } finally {
                    setLoading(false);
                  }
                }}
              />
            </label>
          </div>

          {chats.length === 0 && (
            <div style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "15%" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎓</div>
              <h2 style={{ color: "var(--text-main)" }}>Hi! I'm your AI Study Partner.</h2>
              <p>Upload a syllabus or just start typing to begin.</p>
            </div>
          )}

          {chats.map((c, i) => (
            <div key={i} className="message-entry" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ alignSelf: "flex-end", background: "linear-gradient(135deg, var(--primary), #6d28d9)", color: "#fff", padding: "1rem 1.4rem", borderRadius: "22px 22px 4px 22px", maxWidth: "75%", boxShadow: "0 4px 12px rgba(139, 92, 246, 0.2)" }}>
                {c.u}
              </div>
              <div style={{
                alignSelf: "flex-start",
                background: "rgba(255,255,255,0.03)",
                padding: "1rem 1.4rem",
                borderRadius: "22px 22px 22px 4px",
                maxWidth: "85%",
                border: "1px solid var(--glass-border)",
                whiteSpace: "pre-wrap",
                lineHeight: "1.6",
                fontSize: "0.98rem"
              }}>
                {c.b === "Thinking..." ? (
                  <div style={{ display: "flex", gap: "6px", alignItems: "center", padding: "4px 0" }}>
                    <div className="typing-dot" style={{ animationDelay: "0s" }}></div>
                    <div className="typing-dot" style={{ animationDelay: "0.2s" }}></div>
                    <div className="typing-dot" style={{ animationDelay: "0.4s" }}></div>
                  </div>
                ) : c.b}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Interactive Quiz UI */}
        {activeQuiz && (
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(10, 15, 28, 0.95)", zIndex: 110,
            display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"
          }}>
            <div className="glass-card" style={{ padding: "3rem", width: "100%", maxWidth: "650px", minHeight: "450px", display: "flex", flexDirection: "column", boxShadow: "0 0 50px var(--primary-glow)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2.5rem", alignItems: "center" }}>
                <span style={{ color: "var(--primary)", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.85rem" }}>Question {quizIndex + 1} of {activeQuiz.length}</span>
                <div style={{ background: "rgba(255,255,255,0.05)", padding: "4px 12px", borderRadius: "20px", border: "1px solid var(--glass-border)" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "600" }}>{Math.round(((quizIndex) / activeQuiz.length) * 100)}% Complete</span>
                </div>
              </div>

              <h2 style={{ fontSize: "1.8rem", marginBottom: "3rem", lineHeight: "1.4", fontWeight: "700" }}>{activeQuiz[quizIndex].question}</h2>

              <div style={{ display: "grid", gap: "1.2rem", flex: 1 }}>
                {activeQuiz[quizIndex].options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswerSelect(opt)}
                    className="choice-btn"
                    style={{
                      padding: "1.2rem 1.8rem",
                      textAlign: "left",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "16px",
                      fontSize: "1.05rem",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      justifyContent: "flex-start"
                    }}
                  >
                    <span style={{ opacity: 0.5, marginRight: "12px", fontWeight: "800" }}>{String.fromCharCode(65 + i)}</span>
                    {opt}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setActiveQuiz(null)}
                style={{ marginTop: "2.5rem", background: "none", color: "#f87171", fontSize: "0.9rem", border: "none", textDecoration: "underline", opacity: 0.7 }}
              >
                Quit Quiz Session
              </button>
            </div>
          </div>
        )}

        {/* Quiz Results Summary */}
        {quizResult && (
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(10, 15, 28, 0.98)", zIndex: 120,
            padding: "40px 20px", overflowY: "auto"
          }}>
            <div style={{ maxWidth: "900px", margin: "0 auto" }}>
              <div className="glass-card" style={{ padding: "4rem", textAlign: "center", marginBottom: "3rem", border: "2px solid var(--primary-glow)" }}>
                <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>{quizResult.score === quizResult.total ? "🏆" : "🎉"}</div>
                <h1 style={{ fontSize: "4.5rem", marginBottom: "0.5rem", fontWeight: "900" }} className="title">{quizResult.score} / {quizResult.total}</h1>
                <p style={{ fontSize: "1.4rem", color: "var(--text-muted)", marginBottom: "2.5rem", fontWeight: "500" }}>
                  {quizResult.score === quizResult.total ? "Perfect Mastery Achieved!" : quizResult.score > quizResult.total / 2 ? "Impressive Performance!" : "Solid Effort, Keep Learning!"}
                </p>
                <button
                  onClick={() => setQuizResult(null)}
                  style={{ background: "linear-gradient(135deg, var(--primary), #6d28d9)", padding: "16px 50px", borderRadius: "16px", fontWeight: "bold", fontSize: "1.1rem", margin: "0 auto" }}
                >
                  Return to Study Chat
                </button>
              </div>

              <h2 style={{ marginBottom: "2rem", fontSize: "1.8rem", fontWeight: "700" }}>Performance Review</h2>
              <div style={{ display: "grid", gap: "1.5rem" }}>
                {quizResult.summary.map((item, i) => (
                  <div key={i} className="glass-card" style={{ padding: "2rem", borderLeft: `6px solid ${item.isCorrect ? "#10b981" : "#ef4444"}`, animation: `fadeIn 0.5s ease-out ${i * 0.1}s forwards`, opacity: 0 }}>
                    <p style={{ fontWeight: "700", marginBottom: "1.2rem", fontSize: "1.1rem" }}>{i + 1}. {item.question}</p>
                    <div style={{ display: "grid", gap: "0.8rem", fontSize: "1rem" }}>
                      <p style={{ color: item.isCorrect ? "#10b981" : "#f87171", display: "flex", alignItems: "center", gap: "8px", fontWeight: "600" }}>
                        {item.isCorrect ? "✓ Correct" : "✗ Your Answer"}: {item.userAnswer}
                      </p>
                      <p style={{ color: "#10b981", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
                        ✨ {item.isCorrect ? "Confirmed" : "Correct Answer"}: {item.answer}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quiz Modal */}
        {showQuizModal && (
          <div style={{
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.8)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}>
            <div className="glass-card" style={{ padding: "2rem", width: "100%", maxWidth: "350px", background: "var(--bg-card)" }}>
              <h3 style={{ marginBottom: "1.5rem", textAlign: "center" }}>🎓 Quiz Settings</h3>

              <div style={{ marginBottom: "1.2rem" }}>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.5rem" }}>Topic (Leave blank for general)</label>
                <input
                  type="text"
                  placeholder="e.g. Photosynthesis"
                  value={quizSettings.topic}
                  onChange={e => setQuizSettings({ ...quizSettings, topic: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && generateQuiz()}
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ marginBottom: "2rem" }}>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.5rem" }}>Number of Questions: {quizSettings.count}</label>
                <input
                  type="range"
                  min="1" max="50"
                  value={quizSettings.count}
                  onChange={e => setQuizSettings({ ...quizSettings, count: parseInt(e.target.value) })}
                  style={{ width: "100%", cursor: "pointer" }}
                />
              </div>

              <div style={{ display: "flex", gap: "1rem" }}>
                <button
                  onClick={() => setShowQuizModal(false)}
                  style={{ flex: 1, background: "rgba(255,255,255,0.1)", color: "#fff" }}
                >
                  Cancel
                </button>
                <button
                  onClick={generateQuiz}
                  style={{ flex: 2, background: "var(--primary)" }}
                >
                  Start Quiz
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Input Area */}
        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          style={{ padding: "1.5rem", borderTop: "1px solid var(--glass-border)", display: "flex", gap: "1rem", alignItems: "center", background: "rgba(0,0,0,0.1)" }}
        >
          <button
            type="button"
            onClick={() => setShowQuizModal(true)}
            style={{
              background: "linear-gradient(135deg, #059669, #10b981)",
              padding: "12px 20px",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
            disabled={loading}
          >
            <span>{loading ? "..." : "🎓 Quiz"}</span>
          </button>

          <input
            style={{
              flex: 1,
              background: "rgba(0,0,0,0.2)",
              border: "1px solid var(--glass-border)",
              height: "48px",
              fontSize: "1rem"
            }}
            value={msg}
            onChange={e => setMsg(e.target.value)}
            placeholder="Type your question or topic..."
            disabled={loading}
          />

          <button
            type="submit"
            disabled={loading || !msg.trim()}
            style={{
              width: "48px",
              height: "48px",
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "12px"
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </form>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
