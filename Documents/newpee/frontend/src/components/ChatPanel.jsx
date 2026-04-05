import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { runQuery } from '../api'

const SUGGESTIONS = [
  'How does RAG reduce hallucinations?',
  'Compare fine-tuning vs retrieval augmented generation',
  'What is hybrid search in information retrieval?',
  'Explain transformer architecture and attention mechanisms',
]

export default function ChatPanel({ onNewResult, wikiMode }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async (question) => {
    const q = (question || input).trim()
    if (!q || loading) return
    setInput('')

    setMessages(prev => [...prev, { role: 'user', text: q }])
    setLoading(true)

    try {
      const result = await runQuery(q, wikiMode)
      setMessages(prev => [...prev, { role: 'assistant', ...result }])
      onNewResult(result)
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'error',
        text: e.response?.data?.error || 'Something went wrong. Is the backend running?'
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const autoResize = (e) => {
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  return (
    <div className="chat-panel">
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="welcome-screen">
            <div className="welcome-orb">🔬</div>
            <h1 className="welcome-title">Research Assistant</h1>
            <p className="welcome-desc">
              Upload PDFs or enable Wikipedia mode, then ask any research question.
              I'll synthesize cross-document answers with cited sources.
            </p>
            <div className="suggestion-chips">
              {SUGGESTIONS.map(s => (
                <button key={s} className="chip" onClick={() => handleSend(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => {
            if (msg.role === 'user') {
              return (
                <div key={i} className="message-group">
                  <div className="msg-user">{msg.text}</div>
                </div>
              )
            }
            if (msg.role === 'error') {
              return <div key={i} className="error-toast">⚠️ {msg.text}</div>
            }
            return (
              <div key={i} className="message-group">
                <div className="msg-assistant">
                  <ReactMarkdown>{msg.answer}</ReactMarkdown>
                  {msg.queries?.length > 0 && (
                    <div className="msg-meta">
                      <div className="query-chips">
                        {msg.queries.map((q, qi) => (
                          <span key={qi} className="query-chip">{q}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}

        {loading && (
          <div className="typing-bubble">
            <span className="typing-label">Researching</span>
            <div className="typing-dots">
              <span /><span /><span />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="chat-input-bar">
        <div className="chat-input-wrapper">
          <textarea
            ref={textareaRef}
            id="chat-input"
            className="chat-textarea"
            placeholder={wikiMode
              ? 'Ask anything — Wikipedia docs will be fetched automatically…'
              : 'Ask a question about your uploaded documents…'}
            value={input}
            onChange={e => { setInput(e.target.value); autoResize(e) }}
            onKeyDown={handleKey}
            rows={1}
          />
          <button
            id="send-btn"
            className="btn-send"
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  )
}
