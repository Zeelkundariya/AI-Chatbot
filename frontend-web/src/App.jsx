import { useState } from "react";
import Login from "./Login";
import Chat from "./Chat";
import AdminDashboard from "./AdminDashboard";
import "./index.css";

export default function App() {
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);

  if (!token) return <Login setToken={setToken} setRole={setRole} />;
  return role === "admin"
    ? <AdminDashboard token={token} setToken={setToken} />
    : <Chat token={token} setToken={setToken} />;
}