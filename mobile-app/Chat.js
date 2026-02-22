import { View, Text, TouchableOpacity, TextInput, FlatList, KeyboardAvoidingView, Platform, Modal, ScrollView } from "react-native";
import { useState, useEffect, useRef } from "react";
import { styles } from "./styles";

export default function Chat({ token, setToken }) {
  const [msg, setMsg] = useState("");
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizSettings, setQuizSettings] = useState({ topic: "", count: 3 });

  // Interactive Quiz State
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [quizResult, setQuizResult] = useState(null);

  const flatListRef = useRef();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const r = await fetch("http://10.0.2.2:8000/chats", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const d = await r.json();
      setChats(d.map(c => ({ u: c.user, b: c.bot })));
    } catch (e) {
      console.error(e);
    }
  };

  const send = async () => {
    if (!msg.trim() || loading) return;
    setLoading(true);
    const userMsg = msg;
    setMsg("");
    setChats(prev => [...prev, { u: userMsg, b: "Thinking..." }]);

    try {
      const r = await fetch("http://10.0.2.2:8000/chat", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: userMsg })
      });
      const d = await r.json();
      setChats(prev => {
        const newChats = [...prev];
        newChats[newChats.length - 1].b = d.response;
        return newChats;
      });
    } catch (e) {
      setChats(prev => {
        const newChats = [...prev];
        newChats[newChats.length - 1].b = "⚠️ Connection error. Please try again.";
        return newChats;
      });
    } finally {
      setLoading(false);
    }
  };

  const generateQuiz = async () => {
    setLoading(true);
    setShowQuizModal(false);
    setActiveQuiz(null);
    setQuizResult(null);

    const requestMsg = `🎓 Quiz Request: ${quizSettings.topic || "General"} (${quizSettings.count} questions)`;
    setChats(prev => [...prev, { u: requestMsg, b: "Thinking..." }]);

    try {
      let url = `http://10.0.2.2:8000/generate-quiz?count=${quizSettings.count}`;
      if (quizSettings.topic) url += `&topic=${encodeURIComponent(quizSettings.topic)}`;

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
        throw new Error("Invalid quiz format received.");
      }

      setChats(prev => {
        const newChats = [...prev];
        newChats[newChats.length - 1].b = "✅ Quiz Ready! Starting now...";
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
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, paddingTop: 10 }}>
        <Text style={[styles.title, { marginBottom: 0, color: '#8b5cf6' }]}>Study Bot Elite</Text>
        <TouchableOpacity
          onPress={() => setToken(null)}
          style={{ padding: 8, borderRadius: 10, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
        >
          <Text style={{ color: '#ef4444', fontWeight: 'bold', fontSize: 12 }}>Logout</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={chats}
        keyExtractor={(_, i) => i.toString()}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 15 }}>
            <View style={styles.msgUser}><Text style={styles.text}>{item.u}</Text></View>
            <View style={styles.msgBot}><Text style={styles.text}>{item.b}</Text></View>
          </View>
        )}
      />

      {/* Quiz Settings Modal */}
      <Modal visible={showQuizModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 }}>
          <View style={styles.glassCard}>
            <Text style={[styles.title, { fontSize: 18 }]}>🎓 Quiz Settings</Text>
            <Text style={{ color: '#94a3b8', marginBottom: 8, fontSize: 12 }}>Topic (e.g. Science, Maths, or leave blank)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. History"
              placeholderTextColor="#475569"
              onChangeText={t => setQuizSettings({ ...quizSettings, topic: t })}
              value={quizSettings.topic}
              onSubmitEditing={generateQuiz}
            />
            <Text style={{ color: '#94a3b8', marginBottom: 8, fontSize: 12 }}>Number of Questions: {quizSettings.count}</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={quizSettings.count.toString()}
              onChangeText={c => setQuizSettings({ ...quizSettings, count: parseInt(c) || 1 })}
              onSubmitEditing={generateQuiz}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <TouchableOpacity style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center' }} onPress={() => setShowQuizModal(false)}>
                <Text style={{ color: '#fff' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 2, padding: 12, borderRadius: 8, backgroundColor: '#10b981', alignItems: 'center' }} onPress={generateQuiz}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Start Quiz</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Interactive Quiz Modal */}
      {activeQuiz && (
        <Modal visible={true} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: '#0f172a', padding: 20 }}>
            <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginTop: 40, marginBottom: 20 }}>
              <Text style={{ color: '#6366f1', fontWeight: 'bold' }}>Question {quizIndex + 1} of {activeQuiz.length}</Text>
              <TouchableOpacity onPress={() => setActiveQuiz(null)}><Text style={{ color: '#ef4444' }}>Quit</Text></TouchableOpacity>
            </View>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 30 }}>{activeQuiz[quizIndex].question}</Text>
            <ScrollView>
              {activeQuiz[quizIndex].options.map((opt, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => handleAnswerSelect(opt)}
                  style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: 20, borderRadius: 18, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}
                >
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '500' }}>
                    <Text style={{ color: '#8b5cf6', fontWeight: '800' }}>{String.fromCharCode(65 + i)}   </Text>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Modal>
      )}

      {/* Quiz Summary Modal */}
      {quizResult && (
        <Modal visible={true} transparent animationType="fade">
          <View style={{ flex: 1, backgroundColor: '#0f172a', padding: 20 }}>
            <ScrollView style={{ marginTop: 40 }}>
              <View style={[styles.glassCard, { alignItems: 'center', marginBottom: 20 }]}>
                <Text style={{ fontSize: 40, color: '#fff', fontWeight: 'bold' }}>{quizResult.score} / {quizResult.total}</Text>
                <Text style={{ color: '#94a3b8', fontSize: 16, marginVertical: 10 }}>Quiz Completed!</Text>
                <TouchableOpacity style={[styles.button, { width: '80%', marginTop: 10 }]} onPress={() => setQuizResult(null)}>
                  <Text style={styles.buttonText}>Back to Chat</Text>
                </TouchableOpacity>
              </View>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>Review Answers</Text>
              {quizResult.summary.map((item, i) => (
                <View key={i} style={[styles.glassCard, { marginBottom: 10, borderLeftWidth: 4, borderLeftColor: item.isCorrect ? '#10b981' : '#ef4444' }]}>
                  <Text style={{ color: '#fff', fontWeight: 'bold', marginBottom: 5 }}>{i + 1}. {item.question}</Text>
                  <Text style={{ color: item.isCorrect ? '#10b981' : '#ef4444' }}>Your: {item.userAnswer}</Text>
                  <Text style={{ color: '#10b981' }}>Correct: {item.answer}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </Modal>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' }}>
          <TouchableOpacity
            style={{ backgroundColor: '#10b981', borderRadius: 8, width: 44, height: 44, justifyContent: 'center', alignItems: 'center' }}
            onPress={() => setShowQuizModal(true)}
          >
            <Text style={{ fontSize: 20 }}>🎓</Text>
          </TouchableOpacity>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0, height: 44 }]}
            value={msg}
            onChangeText={setMsg}
            placeholder="Ask anything..."
            placeholderTextColor="#94a3b8"
            editable={!loading}
          />
          <TouchableOpacity
            style={[styles.button, { paddingHorizontal: 15, height: 44, justifyContent: 'center' }]}
            onPress={send}
            disabled={loading || !msg.trim()}
          >
            <Text style={styles.buttonText}>{loading ? '...' : 'Send'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}