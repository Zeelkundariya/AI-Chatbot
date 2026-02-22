import { View, TextInput, TouchableOpacity, Text, ImageBackground } from "react-native";
import { useState } from "react";
import { styles } from "./styles";

export default function Login({ setToken }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  const handleAction = async () => {
    if (!email || !password) return alert("Please fill all fields");
    setLoading(true);
    const endpoint = isRegister ? "register" : "login";
    try {
      const r = await fetch(`http://10.0.2.2:8000/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const d = await r.json();

      if (isRegister && r.ok) {
        setIsRegister(false);
        alert("Account created! Please sign in.");
      } else if (d.access_token) {
        setToken(d.access_token);
      } else {
        alert(d.detail || "Authentication failed");
      }
    } catch (e) {
      alert("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <View style={styles.glassCard}>
          <Text style={styles.title}>Study Bot Elite</Text>

          {/* Tabs */}
          <View style={{ flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 14, padding: 5, marginBottom: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
            <TouchableOpacity
              onPress={() => setIsRegister(false)}
              style={{ flex: 1, backgroundColor: !isRegister ? '#8b5cf6' : 'transparent', padding: 12, borderRadius: 10, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>SIGN IN</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsRegister(true)}
              style={{ flex: 1, backgroundColor: isRegister ? '#8b5cf6' : 'transparent', padding: 12, borderRadius: 10, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>REGISTER</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            placeholder="Email"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            onChangeText={setEmail}
            value={email}
            autoCapitalize="none"
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            style={styles.input}
            onChangeText={setPassword}
            value={password}
          />
          <TouchableOpacity style={styles.button} onPress={handleAction} disabled={loading}>
            <Text style={styles.buttonText}>
              {loading ? "Processing..." : (isRegister ? "Create Account" : "Sign In")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}