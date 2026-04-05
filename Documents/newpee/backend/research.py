import os
import io
import uuid

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

import wikipedia
import pypdf

from llama_index.llms.groq import Groq
from llama_index.core import Settings, Document, VectorStoreIndex
from llama_index.core.node_parser import SentenceSplitter
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.retrievers.bm25 import BM25Retriever

# ── LLM + Embeddings ──────────────────────────────────────────────────────────
Settings.llm = Groq(model="llama-3.1-8b-instant")
Settings.embed_model = HuggingFaceEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")

# ── In-memory document store ──────────────────────────────────────────────────
_raw_docs = []          # LlamaIndex Document objects
_doc_meta = []          # [{id, title, type, chunks}]
_nodes = []             # All splitted nodes
_index = None           # VectorStoreIndex
_bm25_retriever = None  # BM25Retriever

_splitter = SentenceSplitter(chunk_size=300, chunk_overlap=50)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _rebuild_index():
    global _index, _bm25_retriever, _nodes
    if not _raw_docs:
        _index = None
        _bm25_retriever = None
        _nodes = []
        return
    _nodes = _splitter.get_nodes_from_documents(_raw_docs)
    _index = VectorStoreIndex(_nodes)
    _bm25_retriever = BM25Retriever.from_defaults(nodes=_nodes, similarity_top_k=10)


def get_documents():
    return _doc_meta


def delete_document(doc_id: str) -> bool:
    global _raw_docs, _doc_meta
    before = len(_raw_docs)
    _raw_docs = [d for d in _raw_docs if d.metadata.get("doc_id") != doc_id]
    _doc_meta[:] = [m for m in _doc_meta if m["id"] != doc_id]
    if len(_raw_docs) < before:
        _rebuild_index()
        return True
    return False


# ── Ingestion ─────────────────────────────────────────────────────────────────

def add_wikipedia_docs(query_list: list[str]) -> list[dict]:
    added = []
    for q in query_list:
        try:
            results = wikipedia.search(q)
            if not results:
                continue
            page = wikipedia.page(results[0])
            doc_id = str(uuid.uuid4())
            doc = Document(text=page.content, metadata={"title": page.title, "type": "wikipedia", "doc_id": doc_id})
            _raw_docs.append(doc)
            meta = {"id": doc_id, "title": page.title, "type": "wikipedia", "chunks": 0}
            _doc_meta.append(meta)
            added.append(meta)
        except Exception as e:
            print(f"[Wikipedia] Failed for '{q}': {e}")
    if added:
        _rebuild_index()
        for m in added:
            nodes_for_doc = [n for n in _nodes if n.metadata.get("doc_id") == m["id"]]
            m["chunks"] = len(nodes_for_doc)
    return added


def add_pdf_doc(filename: str, file_bytes: bytes) -> dict:
    reader = pypdf.PdfReader(io.BytesIO(file_bytes))
    text_parts = []
    for page in reader.pages:
        t = page.extract_text()
        if t:
            text_parts.append(t)
    full_text = "\n".join(text_parts)
    if not full_text.strip():
        raise ValueError("PDF has no extractable text")
    doc_id = str(uuid.uuid4())
    title = filename.replace(".pdf", "").replace("_", " ").replace("-", " ")
    doc = Document(text=full_text, metadata={"title": title, "type": "pdf", "doc_id": doc_id, "filename": filename})
    _raw_docs.append(doc)
    _rebuild_index()
    nodes_for_doc = [n for n in _nodes if n.metadata.get("doc_id") == doc_id]
    meta = {"id": doc_id, "title": title, "type": "pdf", "chunks": len(nodes_for_doc), "filename": filename}
    _doc_meta.append(meta)
    return meta


# ── Multi-Query Generation ────────────────────────────────────────────────────

def generate_queries(question: str) -> list[str]:
    prompt = f"""Convert the question into 5 short search topics.
Only return the topic names, one per line.
Do not include numbering or sentences.

Question: {question}"""
    response = Settings.llm.complete(prompt)
    raw = response.text.strip().split("\n")
    queries = []
    for q in raw:
        q = q.strip().lstrip("0123456789.-) ")
        if len(q) > 3:
            queries.append(q)
    return queries[:5]


# ── Hybrid Search with Reciprocal Rank Fusion ─────────────────────────────────

def _reciprocal_rank_fusion(ranked_lists: list[list], k: int = 60) -> list:
    scores = {}
    all_items = {}
    for ranked in ranked_lists:
        for rank, node_with_score in enumerate(ranked):
            node_id = node_with_score.node.node_id
            if node_id not in scores:
                scores[node_id] = 0.0
                all_items[node_id] = node_with_score
            scores[node_id] += 1.0 / (k + rank + 1)
    sorted_ids = sorted(scores, key=lambda x: scores[x], reverse=True)
    return [all_items[nid] for nid in sorted_ids]


def hybrid_search(queries: list[str], top_k: int = 5) -> list[dict]:
    if _index is None or _bm25_retriever is None:
        return []

    vector_retriever = _index.as_retriever(similarity_top_k=top_k * 2)
    all_vector, all_bm25 = [], []

    for q in queries:
        try:
            all_vector.extend(vector_retriever.retrieve(q))
        except Exception:
            pass
        try:
            all_bm25.extend(_bm25_retriever.retrieve(q))
        except Exception:
            pass

    fused = _reciprocal_rank_fusion([all_vector, all_bm25])

    seen_ids = set()
    results = []
    for item in fused:
        nid = item.node.node_id
        if nid not in seen_ids:
            seen_ids.add(nid)
            results.append({
                "text": item.node.text,
                "title": item.node.metadata.get("title", "Unknown"),
                "type": item.node.metadata.get("type", ""),
                "doc_id": item.node.metadata.get("doc_id", ""),
                "score": round(item.score if item.score else 0.0, 4),
            })
    return results[:top_k * 2]


# ── Precision@K ───────────────────────────────────────────────────────────────

def precision_at_k(results: list[dict], keywords: list[str], k: int = 5) -> float:
    if not results or not keywords:
        return 0.0
    relevant = 0
    for item in results[:k]:
        text = item["text"].lower()
        if any(kw.lower() in text for kw in keywords):
            relevant += 1
    return round(relevant / k, 4)


def extract_keywords(question: str, queries: list[str]) -> list[str]:
    words = set()
    for text in [question] + queries:
        for w in text.lower().split():
            w = w.strip("?,.-")
            if len(w) > 4:
                words.add(w)
    return list(words)


# ── Main Pipeline ─────────────────────────────────────────────────────────────

def research_assistant(question: str, wikipedia_mode: bool = False) -> dict:
    queries = generate_queries(question)

    if wikipedia_mode:
        add_wikipedia_docs(queries)

    if _index is None:
        return {
            "answer": "No documents indexed. Please upload PDFs or enable Wikipedia mode.",
            "sources": [],
            "queries": queries,
            "precision": {"p1": 0, "p3": 0, "p5": 0},
        }

    results = hybrid_search(queries, top_k=8)
    context_text = "\n\n".join([f"[{r['title']}]: {r['text']}" for r in results[:6]])

    prompt = f"""You are a research assistant synthesizing information from multiple documents.

Answer the question using ONLY the provided context.
Synthesize information across sources.
If sources disagree, mention both perspectives.
Always cite which document each piece of information comes from.

Context:
{context_text}

Question:
{question}

Answer:"""

    response = Settings.llm.complete(prompt)
    answer = response.text.strip()

    keywords = extract_keywords(question, queries)
    p1 = precision_at_k(results, keywords, k=1)
    p3 = precision_at_k(results, keywords, k=3)
    p5 = precision_at_k(results, keywords, k=5)

    return {
        "answer": answer,
        "sources": results[:6],
        "queries": queries,
        "precision": {"p1": p1, "p3": p3, "p5": p5},
    }
