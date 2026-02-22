from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
import os

# Initialize embeddings (using a lightweight model)
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

def process_pdf(file_path):
    """Load PDF, split into chunks, and create a FAISS index."""
    loader = PyPDFLoader(file_path)
    documents = loader.load()
    
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    chunks = text_splitter.split_documents(documents)
    
    # Store index locally for simplicity (could be improved with MongoDB GridFS or similar)
    vector_store = FAISS.from_documents(chunks, embeddings)
    index_path = f"{file_path}.index"
    vector_store.save_local(index_path)
    return index_path

def get_context(query, index_path):
    """Retrieve relevant chunks from the FAISS index."""
    if not os.path.exists(index_path):
        return ""
    
    vector_store = FAISS.load_local(index_path, embeddings, allow_dangerous_deserialization=True)
    docs = vector_store.similarity_search(query, k=3)
    return "\n".join([doc.page_content for doc in docs])
