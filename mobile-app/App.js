import { useState } from "react";
import Login from "./Login";
import Chat from "./Chat";

export default function App() {
  const [token, setToken] = useState(null);
  return token ? <Chat token={token} setToken={setToken}/> : <Login setToken={setToken}/>;
}