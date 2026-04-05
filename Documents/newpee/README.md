# Research Assistant

A powerful AI-powered research assistant that enables cross-document intelligence through hybrid search and document synthesis. Upload PDFs, query across multiple sources, and get AI-synthesized answers with cited sources.

## 🚀 Features

- **PDF Document Upload**: Extract and index text from PDF files
- **Wikipedia Integration**: Automatically fetch and index relevant Wikipedia articles
- **Hybrid Search**: Combines vector similarity search with BM25 keyword search using reciprocal rank fusion
- **Multi-Query Generation**: Uses AI to generate multiple search perspectives for comprehensive results
- **Cross-Document Synthesis**: AI-powered synthesis of information across multiple sources with citations
- **Precision Metrics**: Built-in evaluation metrics (Precision@K) for search quality assessment
- **Modern Web Interface**: Clean React-based UI for document management and querying

## 🛠️ Tech Stack

### Backend
- **Python 3.13+**
- **Flask** - REST API framework
- **LlamaIndex** - Document indexing and retrieval
- **Groq API** - LLM for query generation and synthesis
- **HuggingFace Transformers** - Sentence embeddings
- **PyPDF2** - PDF text extraction
- **Wikipedia API** - Wikipedia content fetching

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Axios** - HTTP client
- **React Markdown** - Markdown rendering
- **React Dropzone** - File upload component

## 📋 Prerequisites

- Python 3.13 or higher
- Node.js 18+ and npm
- A Groq API key (get one at [groq.com](https://groq.com))

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Guru-8508/smvec.git
cd smvec
```

### 2. Backend Setup

#### Create Virtual Environment
```bash
python3 -m venv .venv_mac
source .venv_mac/bin/activate  # On macOS/Linux
# or
.venv_mac\Scripts\activate     # On Windows
```

#### Install Dependencies
```bash
pip install flask flask-cors python-dotenv wikipedia pypdf llama-index
```

#### Configure Environment
Create a `.env` file in the root directory:
```env
GROQ_API_KEY=your_groq_api_key_here
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

## 🎯 Usage

### Start the Application

#### Backend
```bash
# From project root
python backend/app.py
```
The backend will start on `http://localhost:5050`

#### Frontend
```bash
# From frontend directory
npm run dev
```
The frontend will start on `http://localhost:5173`

### Using the Research Assistant

1. **Upload Documents**: Use the sidebar to upload PDF files
2. **Enable Wikipedia Mode**: Toggle Wikipedia integration for broader research
3. **Ask Questions**: Enter research questions in the chat interface
4. **View Results**: Get AI-synthesized answers with source citations and precision metrics

## 📡 API Endpoints

### Documents
- `GET /api/documents` - List all indexed documents
- `DELETE /api/documents/<doc_id>` - Delete a specific document

### File Upload
- `POST /api/upload` - Upload PDF files (multipart/form-data)

### Query
- `POST /api/query` - Submit research questions
  ```json
  {
    "question": "What is machine learning?",
    "wikipedia_mode": false
  }
  ```

## 🏗️ Architecture

### Backend Flow
1. **Document Ingestion**: PDFs are parsed and split into chunks
2. **Indexing**: Documents are indexed using both vector embeddings and BM25
3. **Query Processing**: Questions are converted to multiple search queries
4. **Hybrid Search**: Combines semantic and keyword-based retrieval
5. **Synthesis**: AI generates answers using retrieved context

### Search Pipeline
```
Question → Multi-Query Generation → Hybrid Search → Context Synthesis → Answer
```

## 🔧 Configuration

### Environment Variables
- `GROQ_API_KEY` - Your Groq API key (required)

### Model Settings
- **LLM**: Groq Llama-3.1-8B-Instant
- **Embeddings**: Sentence Transformers all-MiniLM-L6-v2
- **Chunk Size**: 300 characters with 50 character overlap

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [LlamaIndex](https://www.llamaindex.ai/) for the document indexing framework
- [Groq](https://groq.com/) for fast LLM inference
- [HuggingFace](https://huggingface.co/) for pre-trained models
- [React](https://reactjs.org/) for the frontend framework

## 📞 Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

**Built with ❤️ for researchers and knowledge workers**