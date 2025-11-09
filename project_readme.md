# XYZ Virtual Assistant - AI Agent Chatbot

A production-ready chatbot solution that uses LangChain agents to intelligently route queries between document search (vector store) and web search APIs.

## 🎯 Problem Statement

Build a virtual assistant for XYZ company that:
- Answers questions from client-provided documents
- Uses external APIs for real-time information
- Intelligently decides which tools to use for each query
- Can be deployed to production (EC2)

## 🏗️ Architecture

```
┌─────────────┐
│   Frontend  │ (React + Tailwind)
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

## ✨ Features

### Agent Capabilities
- **Intelligent Routing**: Automatically decides which tools to use based on query
- **Vector Store Search**: ChromaDB with OpenAI embeddings for document retrieval
- **Web Search**: Tavily API integration for real-time information
- **Multi-Tool Coordination**: Can use multiple tools in a single query

### Backend (FastAPI + LangChain)
- RESTful API with FastAPI
- LangChain agent with OpenAI GPT-4
- ChromaDB vector database
- Document upload and processing
- Automatic text chunking and embedding
- CORS enabled for frontend integration

### Frontend (React)
- Modern, responsive UI with Tailwind CSS
- Document management system
- Real-time chat interface
- Tool usage indicators
- Error handling and status monitoring

## 📋 Prerequisites

- Python 3.11+
- Node.js 16+ (for frontend development)
- OpenAI API Key ([Get here](https://platform.openai.com/api-keys))
- Tavily API Key ([Get here](https://tavily.com))
- AWS Account (for EC2 deployment)

## 🚀 Quick Start

### 1. Backend Setup (Local Development)

```bash
# Clone or navigate to backend directory
cd backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and add your API keys

# Run the server
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

### 2. Frontend Setup (Local Development)

The frontend is provided as a React artifact. To use it:

1. Update the `API_BASE_URL` in the React component to point to your backend
2. Use it directly in your React application or copy the code

### 3. Test the Application

```bash
# Test health endpoint
curl http://localhost:8000/health

# Upload a document
curl -X POST http://localhost:8000/upload \
  -F "file=@your-document.txt"

# Send a query
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What is in my documents?"}'
```

## 📦 Project Structure

```
xyz-chatbot/
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── requirements.txt        # Python dependencies
│   ├── Dockerfile             # Docker container definition
│   ├── docker-compose.yml     # Docker Compose configuration
│   ├── .env.example           # Environment variables template
│   └── chroma_db/             # Vector store data (created at runtime)
├── frontend/
│   └── XYZChatbot.jsx         # React component
├── deployment/
│   ├── setup_ec2.sh           # Automated EC2 setup script
│   └── DEPLOYMENT.md          # Detailed deployment guide
└── README.md                  # This file
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

Update the `API_BASE_URL` in the React component:

```javascript
const API_BASE_URL = 'http://localhost:8000';  // Local development
// const API_BASE_URL = 'http://your-ec2-ip:8000';  // EC2 deployment
// const API_BASE_URL = 'https://your-domain.com';  // Production with SSL
```

## 🚢 Deployment to EC2

### Option 1: Automated Setup (Recommended)

```bash
# 1. Launch EC2 instance (Ubuntu 22.04, t3.medium)
# 2. Connect via SSH
ssh -i your-key.pem ubuntu@ec2-ip-address

# 3. Upload files
scp -i your-key.pem -r ./backend ubuntu@ec2-ip-address:~/

# 4. Run setup script
cd ~/backend
chmod +x setup_ec2.sh
./setup_ec2.sh
```

The script will:
- Install all dependencies
- Configure Docker/Systemd
- Setup Nginx reverse proxy
- Configure SSL (optional)
- Start the application

### Option 2: Manual Setup

See the detailed [EC2 Deployment Guide](deployment/DEPLOYMENT.md) for step-by-step instructions.

### Option 3: Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## 📚 API Documentation

Once running, visit `http://localhost:8000/docs` for interactive API documentation (Swagger UI).

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API information |
| GET | `/health` | Health check |
| POST | `/upload` | Upload documents |
| POST | `/query` | Send chat queries |
| GET | `/documents` | List uploaded documents |
| DELETE | `/documents` | Clear all documents |

### Example Requests

**Upload Document:**
```bash
curl -X POST http://localhost:8000/upload \
  -F "file=@document.txt"
```

**Send Query:**
```bash
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the latest AI developments?"
  }'
```

**Response:**
```json
{
  "response": "Based on web search...",
  "tools_used": ["🌐 Web Search"],
  "sources": [],
  "timestamp": "2024-11-08T10:30:00Z"
}
```

## 🧪 Testing

### Backend Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest tests/
```

### Frontend Tests

```bash
# Install dependencies
npm install

# Run tests
npm test
```

## 🔍 How the Agent Works

1. **User sends a query** → Frontend sends POST request to `/query`
2. **Agent receives query** → LangChain agent analyzes the request
3. **Tool selection** → Agent decides which tools to use:
   - **DocumentSearch**: For questions about uploaded documents
   - **WebSearch**: For current events, news, or when documents lack info
4. **Tool execution** → Agent calls the selected tool(s)
5. **Response generation** → Agent synthesizes results and responds
6. **Frontend displays** → Response shown with tool indicators

### Example Query Flow

**Query:** "What is in my uploaded contract document?"
- ✅ Uses DocumentSearch tool
- ❌ Doesn't use WebSearch (not needed)

**Query:** "What's the latest news about AI?"
- ❌ Doesn't use DocumentSearch (not relevant)
- ✅ Uses WebSearch tool

**Query:** "Compare our company policy with current industry standards"
- ✅ Uses DocumentSearch (for company policy)
- ✅ Uses WebSearch (for industry standards)

## 🛠️ Customization

### Adding New Tools

```python
# In main.py, define a new tool function
def custom_search(query: str) -> str:
    """Your custom tool logic"""
    return result

# Add to tools list
tools.append(
    Tool(
        name="CustomSearch",
        func=custom_search,
        description="When to use this tool"
    )
)
```

### Changing the LLM

```python
# In main.py, update the LLM
llm = ChatOpenAI(
    model="gpt-4-turbo-preview",  # or "gpt-3.5-turbo"
    temperature=0.7,
    openai_api_key=openai_api_key
)
```

### Adjusting Vector Store Parameters

```python
# Chunk size and overlap
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,      # Smaller chunks for more precise retrieval
    chunk_overlap=100,   # Overlap between chunks
    length_function=len,
)

# Number of results returned
results = vectorstore.similarity_search(query, k=5)  # Return top 5
```

## 📊 Monitoring and Maintenance

### View Logs (Docker)
```bash
docker-compose logs -f backend
```

### View Logs (Systemd)
```bash
sudo journalctl -u xyz-chatbot -f
```

### Check Health
```bash
curl http://localhost:8000/health
```

### Backup Vector Store
```bash
tar -czf chroma_backup_$(date +%Y%m%d).tar.gz chroma_db/
```

## 🔒 Security Best Practices

1. **API Keys**: Never commit `.env` file to version control
2. **HTTPS**: Always use SSL in production
3. **Rate Limiting**: Implement rate limiting for production
4. **CORS**: Restrict origins in production
5. **Authentication**: Add user authentication for production use
6. **Input Validation**: Validate all user inputs
7. **Regular Updates**: Keep dependencies updated

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port 8000 is in use
sudo lsof -i :8000

# Check logs
docker-compose logs backend
# or
sudo journalctl -u xyz-chatbot -xe
```

### Vector store errors
```bash
# Clear and reinitialize
rm -rf chroma_db/
# Restart the application
```

### API key errors
```bash
# Verify .env file exists and has correct keys
cat .env

# Test API keys
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

## 📈 Performance Optimization

1. **Use GPU instances** for faster embeddings (optional)
2. **Implement caching** for frequently asked questions
3. **Optimize chunk size** based on your documents
4. **Use async operations** for concurrent tool calls
5. **Index optimization** in vector store

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **LangChain**: Agent framework
- **OpenAI**: LLM and embeddings
- **Tavily**: Web search API
- **ChromaDB**: Vector database
- **FastAPI**: Backend framework
- **React**: Frontend framework

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Contact: support@xyz-company.com
- Documentation: [Link to docs]

## 🗺️ Roadmap

- [ ] Add authentication and user management
- [ ] Implement conversation history
- [ ] Add support for more file types (PDF, DOCX, etc.)
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Mobile app version
- [ ] Integration with Slack/Teams

---

**Built with ❤️ by XYZ Company**