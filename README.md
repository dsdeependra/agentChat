# AgentChat - AI-Powered Chatbot Agent

An intelligent chatbot solution that uses LangChain agents to intelligently route queries between document search (vector store) and web search APIs, providing domain-specific answers using AI tools.

## 🎯 Overview

AgentChat is a production-ready chatbot that combines:
- **Document Search**: Vector store (ChromaDB) for searching through uploaded documents
- **Web Search**: Tavily API integration for real-time information retrieval
- **Intelligent Routing**: LangChain agent that automatically decides which tools to use based on the query

## ✨ Features

- **Intelligent Agent**: Automatically routes queries to the appropriate tool (document search or web search)
- **Document Management**: Upload and search through your own documents using vector embeddings
- **Real-time Web Search**: Get up-to-date information from the web using Tavily API
- **Modern UI**: React-based frontend with Tailwind CSS styling
- **RESTful API**: FastAPI backend with comprehensive endpoints
- **Production Ready**: Docker support and EC2 deployment guides included

## 🏗️ Architecture

```
┌─────────────┐
│   Frontend  │ (React + TypeScript)
│  (Port 3000)│
└──────┬──────┘
       │ HTTP/REST
       ▼
┌─────────────────────────────────────┐
│      Backend API (FastAPI)          │
│         (Port 8000)                 │
│  ┌───────────────────────────────┐  │
│  │   LangChain Agent             │  │
│  │   (GPT-4 Decision Making)     │  │
│  └────┬──────────────────┬───────┘  │
│       │                  │          │
│       ▼                  ▼          │
│  ┌─────────┐      ┌──────────┐     │
│  │ Vector  │      │  Tavily  │     │
│  │  Store  │      │  Search  │     │
│  │(ChromaDB)│      │   API    │     │
│  └─────────┘      └──────────┘     │
└─────────────────────────────────────┘
```

## 📋 Prerequisites

- **Python 3.11+** (for backend)
- **Node.js 16+** (for frontend)
- **OpenAI API Key** ([Get here](https://platform.openai.com/api-keys))
- **Tavily API Key** ([Get here](https://tavily.com))
- **AWS Account** (optional, for EC2 deployment)

## 🚀 Quick Start

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python3.11 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r backend_requirements.txt
   ```

4. **Create `.env` file:**
   ```env
   OPENAI_API_KEY=sk-your-openai-api-key
   TAVILY_API_KEY=tvly-your-tavily-api-key
   OPENAI_MODEL=gpt-4
   HOST=0.0.0.0
   PORT=8000
   ```

5. **Run the server:**
   ```bash
   uvicorn main:app --reload
   ```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Update API URL** in `frontend/xyz_chatbot_agent.tsx`:
   ```typescript
   const API_BASE_URL = 'http://localhost:8000'; // Change to your backend URL
   ```

3. **Use the component** in your React application or run with your preferred React setup.

## 📦 Project Structure

```
agentChat/
├── backend/
│   ├── backend_requirements.txt    # Python dependencies
│   ├── backend_dockerfile.txt      # Docker configuration
│   ├── backend_docker_compose.yml  # Docker Compose setup
│   └── (main.py and other backend files)
├── frontend/
│   └── xyz_chatbot_agent.tsx       # React chatbot component
├── deployment/
│   ├── ec2_deployment_guide.md     # EC2 deployment instructions
│   └── ec2_setup_script.sh         # Automated EC2 setup script
├── package.json                     # Frontend dependencies
└── README.md                        # This file
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
OPENAI_API_KEY=sk-your-openai-api-key
TAVILY_API_KEY=tvly-your-tavily-api-key
OPENAI_MODEL=gpt-4
HOST=0.0.0.0
PORT=8000
```

### Frontend Configuration

Update the `API_BASE_URL` in `frontend/xyz_chatbot_agent.tsx`:

```typescript
const API_BASE_URL = 'http://localhost:8000';  // Local development
// const API_BASE_URL = 'http://your-ec2-ip:8000';  // EC2 deployment
// const API_BASE_URL = 'https://your-domain.com';  // Production with SSL
```

## 📚 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API information |
| GET | `/health` | Health check |
| POST | `/upload` | Upload documents |
| POST | `/query` | Send chat queries |
| GET | `/documents` | List uploaded documents |
| DELETE | `/documents` | Clear all documents |

### Example API Usage

**Health Check:**
```bash
curl http://localhost:8000/health
```

**Upload Document:**
```bash
curl -X POST http://localhost:8000/upload \
  -F "file=@your-document.txt"
```

**Send Query:**
```bash
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What is in my documents?"}'
```

**Response Format:**
```json
{
  "response": "Based on your documents...",
  "tools_used": ["📄 Document Search"],
  "sources": [],
  "timestamp": "2024-11-08T10:30:00Z"
}
```

## 🚢 Deployment

### Docker Deployment

1. **Build and run with Docker Compose:**
   ```bash
   cd backend
   docker-compose -f backend_docker_compose.yml up -d
   ```

2. **View logs:**
   ```bash
   docker-compose -f backend_docker_compose.yml logs -f
   ```

3. **Stop:**
   ```bash
   docker-compose -f backend_docker_compose.yml down
   ```

### EC2 Deployment

See the detailed [EC2 Deployment Guide](deployment/ec2_deployment_guide.md) for step-by-step instructions.

**Quick Setup:**
```bash
# Upload files to EC2
scp -i your-key.pem -r ./backend ubuntu@ec2-ip-address:~/

# Run setup script
ssh -i your-key.pem ubuntu@ec2-ip-address
cd ~/backend
chmod +x ../deployment/ec2_setup_script.sh
../deployment/ec2_setup_script.sh
```

## 🔍 How It Works

1. **User Query** → Frontend sends POST request to `/query`
2. **Agent Analysis** → LangChain agent analyzes the query
3. **Tool Selection** → Agent decides which tools to use:
   - **DocumentSearch**: For questions about uploaded documents
   - **WebSearch**: For current events or when documents lack info
4. **Tool Execution** → Agent calls the selected tool(s)
5. **Response Generation** → Agent synthesizes results
6. **Display** → Frontend shows response with tool indicators

### Example Query Flows

- **"What is in my uploaded contract?"** → Uses DocumentSearch
- **"What's the latest AI news?"** → Uses WebSearch
- **"Compare our policy with industry standards"** → Uses both tools

## 🛠️ Tech Stack

### Backend
- **FastAPI**:** Web framework
- **LangChain**: Agent framework
- **OpenAI GPT-4**: LLM for decision making
- **ChromaDB**: Vector database
- **Tavily**: Web search API

### Frontend
- **React 19**: UI framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling (via component)
- **Lucide React**: Icons

## 🔒 Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use HTTPS** in production
3. **Implement rate limiting** for production
4. **Restrict CORS** origins in production
5. **Add authentication** for production use
6. **Validate all user inputs**

## 🐛 Troubleshooting

### Backend Issues

```bash
# Check if port 8000 is in use
sudo lsof -i :8000

# Check logs (Docker)
docker-compose logs backend

# Verify API keys
cat backend/.env
```

### Frontend Issues

- Ensure backend is running on the configured port
- Check browser console for errors
- Verify `API_BASE_URL` is correct

## 📄 License

This project is licensed under the MIT License.

## 👤 Author

**Deependra**
- Email: deependraiiitm@gmail.com
- GitHub: [dsdeependra](https://github.com/dsdeependra)

## 🙏 Acknowledgments

- **LangChain**: Agent framework
- **OpenAI**: LLM and embeddings
- **Tavily**: Web search API
- **ChromaDB**: Vector database
- **FastAPI**: Backend framework
- **React**: Frontend framework

---

**Built with ❤️ for intelligent AI-powered conversations**
