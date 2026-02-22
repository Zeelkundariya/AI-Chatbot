# 🎓 Study Bot Elite - AI-Powered Learning Assistant

Study Bot Elite is an advanced, cross-platform study assistant designed to transform the learning experience. Built with a focus on technical excellence and premium aesthetics, it provides students with a powerful suite of tools to master any subject.

## 🌟 Key Features

- **🧠 Conversational AI Memory**: Powered by LLMs (Llama-3 via Groq and LangChain) with full contextual awareness. The bot remembers your previous interactions for natural, continuous learning.
- **📚 Smart RAG (Retrieval-Augmented Generation)**: Upload PDFs to create a custom knowledge base. The AI retrieves specific information from your study materials to provide accurate, evidence-based answers.
- **🎮 Interactive Step-by-Step Quizzes**: Generate personalized MCQ tests based on your study topics or transcripts. Features real-time scoring, progress tracking, and detailed answer reviews.
- **✨ Elite Design System**: A state-of-the-art interface featuring a cinematic glassmorphism theme, vibrant indigo-to-violet gradients, and smooth micro-animations.
- **📱 Cross-Platform Parity**: Seamlessly transition between the Web app and the Mobile app (Android/iOS) while maintaining the same "Elite" experience.
- **📊 Persistent Study History**: All your conversations and progress are securely stored in MongoDB and sorted chronologically for easy reference.

## 🛠️ Tech Stack

- **Backend**: FastAPI, LangChain, LangChain-Groq, MongoDB, FAISS (Vector DB).
- **Frontend (Web)**: React.js (Vite), Modern CSS3 (Keyframe Animations, Gradients).
- **Mobile**: React Native (Android/iOS compatibility).
- **LLM**: Llama-3.1-8b-instant (via Groq Cloud).

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js & npm
- MongoDB Account (Atlas or Local)
- Groq API Key

### Backend Setup

1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure `.env` (use `.env.example` as a template):
   ```env
   GROQ_API_KEY=your_key
   MONGO_URI=your_mongodb_uri
   SECRET_KEY=your_secret
   ```
5. Run the server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Web Frontend Setup

1. Navigate to the `frontend-web` folder:
   ```bash
   cd frontend-web
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### Mobile App Setup

1. Navigate to the `mobile-app` folder:
   ```bash
   cd mobile-app
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the application:
   ```bash
   npx react-native start
   ```

## 📝 Project Structure

- `/backend`: FastAPI server, AI logic (LangChain), and RAG implementation.
- `/frontend-web`: React-based web interface with "Elite" styling.
- `/mobile-app`: React Native mobile application.
- `render.yaml`: Configuration for automated deployment on Render.

## ✅ Requirements Alignment

This project fully implements and exceeds the requirements outlined in the `Project-chatbot.pdf` blueprint, including:
- AI Chatbot Integration.
- Contextual Memory (Last 5 messages).
- Persistent History (MongoDB).
- Local hosting & verification readiness.

---
Built with ❤️ for student excellence. 🎓🚀
