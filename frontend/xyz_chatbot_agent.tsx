import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, FileText, Globe, Database, Loader2, Upload, Trash2, AlertCircle } from 'lucide-react';

const XYZChatbot = () => {
  // Configure your backend URL here
  const API_BASE_URL = 'http://localhost:8000'; // Change to your EC2 IP or domain
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/documents`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload document');
      }

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'system',
        content: `✅ Document "${data.filename}" uploaded successfully! (${data.chunks} chunks processed)`,
        timestamp: new Date().toISOString()
      }]);

      await fetchDocuments();
    } catch (err) {
      setError(`Upload failed: ${err.message}`);
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'system',
        content: `❌ Failed to upload document: ${err.message}`,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: input }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from server');
      }

      const data = await response.json();

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: data.response,
        tools_used: data.tools_used || [],
        timestamp: data.timestamp
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      setError(`Query failed: ${err.message}`);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: `❌ Sorry, I encountered an error: ${err.message}. Please make sure the backend server is running.`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const clearDocuments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/documents`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to clear documents');
      }

      setDocuments([]);
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'system',
        content: '🗑️ All documents cleared from vector store.',
        timestamp: new Date().toISOString()
      }]);
    } catch (err) {
      setError(`Clear failed: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-t-2xl shadow-lg p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-600 p-3 rounded-xl">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">XYZ Virtual Assistant</h1>
                <p className="text-sm text-gray-600">AI Agent with LangChain, Vector Store & Tavily Search</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-indigo-600" />
              <span className="text-sm font-medium text-gray-700">{documents.length} documents</span>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4 flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-sm text-red-700">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mt-4">
          {/* Sidebar */}
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-indigo-600" />
              Documents ({documents.length})
            </h3>
            
            <label className={`flex items-center justify-center px-4 py-3 bg-indigo-50 text-indigo-600 rounded-lg cursor-pointer hover:bg-indigo-100 transition mb-3 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <Upload className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">
                {uploading ? 'Uploading...' : 'Upload Document'}
              </span>
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                onChange={handleFileUpload} 
                accept=".txt,.md,.pdf"
                disabled={uploading}
              />
            </label>

            {documents.length > 0 && (
              <button
                onClick={clearDocuments}
                className="w-full flex items-center justify-center px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition mb-3 text-sm"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </button>
            )}

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {documents.map((doc, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 truncate">{doc}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-xs font-semibold text-gray-600 mb-2">AVAILABLE TOOLS</h4>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-700">
                  <Database className="w-4 h-4 mr-2 text-green-600" />
                  Vector Store (ChromaDB)
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <Globe className="w-4 h-4 mr-2 text-blue-600" />
                  Tavily Web Search
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-xs font-semibold text-gray-600 mb-2">BACKEND STATUS</h4>
              <div className="text-xs text-gray-500 space-y-1">
                <p className="break-all">API: {API_BASE_URL}</p>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${loading ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                  <span>{loading ? 'Processing...' : 'Ready'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-lg flex flex-col" style={{ height: '600px' }}>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 mt-20">
                  <Bot className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Welcome to XYZ Virtual Assistant</p>
                  <p className="text-sm mt-2 max-w-md mx-auto">
                    I'm powered by LangChain agents with access to your documents (vector store) 
                    and real-time web search via Tavily API. Upload documents and ask me anything!
                  </p>
                </div>
              )}

              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-start space-x-2 max-w-3xl ${msg.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`p-2 rounded-full flex-shrink-0 ${msg.type === 'user' ? 'bg-indigo-600' : msg.type === 'system' ? 'bg-gray-400' : 'bg-green-600'}`}>
                      {msg.type === 'user' ? (
                        <User className="w-5 h-5 text-white" />
                      ) : (
                        <Bot className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className={`p-4 rounded-2xl ${
                      msg.type === 'user' 
                        ? 'bg-indigo-600 text-white' 
                        : msg.type === 'system'
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                      {msg.tools_used && msg.tools_used.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-300">
                          <p className="text-xs font-semibold text-gray-600 mb-1">Tools used:</p>
                          <div className="flex flex-wrap gap-1">
                            {msg.tools_used.map((tool, idx) => (
                              <span key={idx} className="text-xs bg-white px-2 py-1 rounded text-gray-700">
                                {tool}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center space-x-2 bg-gray-100 p-4 rounded-2xl">
                    <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                    <span className="text-sm text-gray-700">Agent is processing your request...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !loading && handleSend()}
                  placeholder="Ask me anything..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  disabled={loading}
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Powered by LangChain • OpenAI GPT-4 • ChromaDB • Tavily Search
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default XYZChatbot;