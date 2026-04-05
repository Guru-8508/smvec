import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { uploadFiles } from '../api'

export default function Sidebar({ docs, onDocsChange, wikiMode, onWikiToggle }) {
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!acceptedFiles.length) return
    setUploading(true)
    try {
      await uploadFiles(acceptedFiles)
      onDocsChange()
    } catch (e) {
      console.error(e)
    } finally {
      setUploading(false)
    }
  }, [onDocsChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'] },
    multiple: true,
  })

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title">Documents</div>
        <div
          {...getRootProps()}
          className={`upload-zone ${isDragActive ? 'drag-active' : ''}`}
          id="upload-dropzone"
        >
          <input {...getInputProps()} id="file-upload-input" />
          <div className="upload-icon">📄</div>
          <div className="upload-label">
            {isDragActive ? (
              'Drop files here…'
            ) : (
              <><span>Click</span> or drag PDFs here</>
            )}
          </div>
          {uploading && (
            <div className="upload-progress-bar" style={{ marginTop: 10 }}>
              <div className="upload-progress-fill" />
            </div>
          )}
        </div>
      </div>

      <div className="doc-list">
        {docs.length === 0 ? (
          <div className="empty-docs">
            📭 No documents yet<br />
            Upload a PDF or enable<br />Wikipedia mode below
          </div>
        ) : (
          docs.map(doc => (
            <DocItem key={doc.id} doc={doc} onDelete={() => onDocsChange(doc.id)} />
          ))
        )}
      </div>

      <div className="wiki-toggle">
        <label className="toggle-row">
          <span className="toggle-label">🌐 Fetch from Wikipedia</span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              id="wiki-toggle-input"
              checked={wikiMode}
              onChange={e => onWikiToggle(e.target.checked)}
            />
            <span className="toggle-slider" />
          </label>
        </label>
      </div>
    </aside>
  )
}

function DocItem({ doc, onDelete }) {
  const handleDelete = async () => {
    const { deleteDocument } = await import('../api')
    await deleteDocument(doc.id)
    onDelete()
  }

  return (
    <div className="doc-item">
      <div className="doc-icon">{doc.type === 'pdf' ? '📕' : '🌐'}</div>
      <div className="doc-info">
        <div className="doc-name" title={doc.title}>{doc.title}</div>
        <div className="doc-meta">{doc.chunks} chunks</div>
      </div>
      <span className={`doc-badge ${doc.type === 'pdf' ? 'pdf' : 'wiki'}`}>
        {doc.type}
      </span>
      <button className="btn-delete" onClick={handleDelete} title="Remove">✕</button>
    </div>
  )
}
