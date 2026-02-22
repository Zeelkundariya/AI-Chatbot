import os
from datetime import datetime
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage
from app.database import chat_collection
from app.rag import get_context

def get_llm():
    return ChatGroq(
        api_key=os.getenv("GROQ_API_KEY"),
        model_name="llama-3.1-8b-instant"
    )

SYSTEM_PROMPT = "You are a helpful Study Bot. Use the provided context to answer questions if available."

def chat_with_bot(user_id, msg, index_path=None):
    llm = get_llm()
    context = ""
    if index_path:
        context = get_context(msg, index_path)
    
    # Fetch history for conversational memory
    history = list(chat_collection.find({"user_id": user_id}).sort("created_at", -1).limit(5))
    history_text = "\n".join([f"User: {c['user']}\nBot: {c['bot']}" for c in reversed(history)])
    
    content = f"Previous Conversation:\n{history_text}\n\nContext:\n{context}\n\nUser Question: {msg}" if (context or history_text) else msg
    
    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=content)
    ]
    
    res = llm.invoke(messages)
    bot_res = res.content
    
    chat_collection.insert_one({
        "user_id": user_id,
        "user": msg,
        "bot": bot_res,
        "pdf_context": bool(index_path),
        "created_at": datetime.utcnow()
    })
    return bot_res

def generate_quiz_logic(user_id, index_path=None, topic=None, count=3):
    llm = get_llm()
    context = ""
    if index_path:
        context = get_context("key concepts and definitions", index_path)
    
    history = list(chat_collection.find({"user_id": user_id}).sort("created_at", -1).limit(10))
    history_text = "\n".join([f"User: {c['user']}\nBot: {c['bot']}" for c in history])
    
    topic_str = f"on the topic: {topic}" if topic else "based on general core concepts"
    
    if not context.strip() and not history_text.strip():
        # Fallback for new users with no data
        prompt = f"""
        Generate {count} general education multiple-choice questions for students {topic_str}.
        You MUST return EXACTLY {count} questions.
        Format your response as a valid JSON list of objects with:
        - question: string
        - options: list of strings (must have exactly 4 options)
        - answer: string (the correct option)
        ONLY return the JSON list. Do not include any other text, markdown blocks, or explanations.
        """
    else:
        prompt = f"""
        Based on the following study context and chat history, generate EXACTLY {count} multiple-choice questions {topic_str}.
        Format your response as a valid JSON list of objects with:
        - question: string
        - options: list of strings (must have exactly 4 options)
        - answer: string (the correct option)
        ONLY return the JSON list. Do not include any other text, markdown blocks, or explanations.

        Context:
        {context}
        
        Chat History:
        {history_text}
        """
    
    messages = [
        SystemMessage(content="You are a Quiz Generator that only outputs JSON."),
        HumanMessage(content=prompt)
    ]
    
    res = llm.invoke(messages)
    return res.content
