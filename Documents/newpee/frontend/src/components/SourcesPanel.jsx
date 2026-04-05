export default function SourcesPanel({ result }) {
  if (!result) {
    return (
      <div className="sources-panel">
        <div className="panel-header">Sources & Metrics</div>
        <div className="panel-scroll">
          <div className="empty-sources">
            🔍 Ask a question to see<br />retrieved source chunks<br />and Precision@K scores
          </div>
        </div>
      </div>
    )
  }

  const { sources = [], precision = {}, queries = [] } = result
  const p1 = precision.p1 ?? 0
  const p3 = precision.p3 ?? 0
  const p5 = precision.p5 ?? 0

  return (
    <div className="sources-panel">
      <div className="panel-header">Sources & Metrics</div>

      <div className="panel-scroll">
        {sources.map((src, i) => (
          <div key={i} className="source-card" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="source-card-header">
              <div className="source-num">{i + 1}</div>
              <div className="source-title" title={src.title}>{src.title}</div>
              <TypeBadge type={src.type} />
            </div>
            <div className="source-text">{src.text}</div>
          </div>
        ))}
      </div>

      <div className="precision-section">
        <div className="precision-title">Precision @ K</div>
        <PkBar label="P@1" value={p1} colorClass="green" />
        <PkBar label="P@3" value={p3} colorClass="blue" />
        <PkBar label="P@5" value={p5} colorClass="purple" />
      </div>
    </div>
  )
}

function PkBar({ label, value, colorClass }) {
  return (
    <div className="pk-row">
      <span className="pk-label">{label}</span>
      <div className="pk-bar-bg">
        <div
          className={`pk-bar-fill ${colorClass}`}
          style={{ width: `${Math.round(value * 100)}%` }}
        />
      </div>
      <span className="pk-value">{(value * 100).toFixed(0)}%</span>
    </div>
  )
}

function TypeBadge({ type }) {
  return (
    <span className={`doc-badge ${type === 'pdf' ? 'pdf' : 'wiki'}`} style={{ marginLeft: 'auto', flexShrink: 0 }}>
      {type}
    </span>
  )
}
