import { useState } from "react";

export default function Login({ setToken, setRole }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError("Please enter a valid email address");
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }
    return true;
  };

  const handleAction = async (e) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError("");
    const endpoint = isRegister ? "register" : "login";
    try {
      const r = await fetch(`http://localhost:8000/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const d = await r.json();

      if (!r.ok) throw new Error(d.detail || "Action failed");

      if (isRegister) {
        setIsRegister(false);
        alert("Account created successfully! ✨ Please login.");
      } else {
        setToken(d.access_token);
        setRole(d.role);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      background: "radial-gradient(circle at 20% 80%, #0f172a, #020617)"
    }}>
      <div className="glass-card" style={{
        width: "100%",
        maxWidth: "420px",
        padding: "3rem",
        animation: "fadeIn 0.6s ease-out"
      }}>
        {/* Tab Switcher */}
        <div style={{
          display: "flex",
          background: "rgba(0,0,0,0.3)",
          borderRadius: "16px",
          padding: "5px",
          marginBottom: "2.5rem",
          border: "1px solid var(--glass-border)"
        }}>
          <button
            type="button"
            onClick={() => { setIsRegister(false); setError(""); }}
            style={{
              flex: 1,
              background: !isRegister ? "var(--primary)" : "transparent",
              borderRadius: "12px",
              padding: "10px",
              fontSize: "0.9rem",
              fontWeight: "600",
              transition: "all 0.3s ease",
              border: "none",
              color: "#fff",
              boxShadow: !isRegister ? "0 4px 12px var(--primary-glow)" : "none"
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setError(""); }}
            style={{
              flex: 1,
              background: isRegister ? "var(--primary)" : "transparent",
              borderRadius: "12px",
              padding: "10px",
              fontSize: "0.9rem",
              fontWeight: "600",
              transition: "all 0.3s ease",
              border: "none",
              color: "#fff",
              boxShadow: isRegister ? "0 4px 12px var(--primary-glow)" : "none"
            }}
          >
            Register
          </button>
        </div>

        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <h1 className="title" style={{ fontSize: "2.2rem", marginBottom: "0.5rem" }}>Study Bot Elite</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            {isRegister ? "Start your advanced learning journey" : "Your AI-Powered Learning Partner"}
          </p>
        </div>

        {error && (
          <div className="message-entry" style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            color: "#f87171",
            padding: "12px",
            borderRadius: "12px",
            marginBottom: "1.5rem",
            fontSize: "0.85rem",
            textAlign: "center"
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleAction} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginLeft: "4px" }}>Email Address</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", position: "relative" }}>
            <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginLeft: "4px" }}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ width: "100%", boxSizing: "border-box", paddingRight: "3.5rem" }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  padding: "8px",
                  color: "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "auto",
                  boxShadow: "none"
                }}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "1rem",
              height: "54px",
              fontSize: "1.05rem",
              fontWeight: "600",
              width: "100%"
            }}
          >
            {loading ? "Processing..." : (isRegister ? "Create Account" : "Enter Dashboard")}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "2rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
          {isRegister ? "Already have an account?" : "New to Study Bot Elite?"}{" "}
          <span
            onClick={() => setIsRegister(!isRegister)}
            style={{ color: "var(--accent)", cursor: "pointer", fontWeight: "600", textDecoration: "underline" }}
          >
            {isRegister ? "Sign In" : "Join Now"}
          </span>
        </p>
      </div>
    </div>
  );

}
