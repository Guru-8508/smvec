import { useState, useEffect, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import ChatPanel from './components/ChatPanel'
import SourcesPanel from './components/SourcesPanel'
import { getDocuments } from './api'

export default function App() {
  const [docs, setDocs] = useState([])
  const [wikiMode, setWikiMode] = useState(false)
  const [latestResult, setLatestResult] = useState(null)

  const refreshDocs = useCallback(async () => {
    try {
      const data = await getDocuments()
      setDocs(data)
    } catch (e) {
      // backend might not be ready yet
    }
  }, [])

  useEffect(() => {
    refreshDocs()
  }, [refreshDocs])

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="header">
        <div className="header-logo">
          <div className="header-icon">🔬</div>
          <span className="header-title">Research Assistant</span>
          <span className="header-subtitle">Cross-Document Intelligence</span>
        </div>
        <div className="header-spacer" />
        <span className="header-badge">
          {docs.length} doc{docs.length !== 1 ? 's' : ''} indexed
        </span>
      </header>

      {/* Sidebar */}
      <Sidebar
        docs={docs}
        onDocsChange={refreshDocs}
        wikiMode={wikiMode}
        onWikiToggle={setWikiMode}
      />

      {/* Chat */}
      <ChatPanel
        onNewResult={result => { setLatestResult(result); refreshDocs() }}
        wikiMode={wikiMode}
      />

      {/* Sources */}
      <SourcesPanel result={latestResult} />
    </div>
  )
}
