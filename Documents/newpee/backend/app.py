import os
from flask import Flask, request, jsonify
from flask_cors import CORS

import research

app = Flask(__name__)
CORS(app)

# ── Documents ─────────────────────────────────────────────────────────────────

@app.route("/api/documents", methods=["GET"])
def list_documents():
    return jsonify(research.get_documents())


@app.route("/api/documents/<doc_id>", methods=["DELETE"])
def delete_document(doc_id):
    ok = research.delete_document(doc_id)
    if ok:
        return jsonify({"success": True})
    return jsonify({"error": "Document not found"}), 404


# ── Upload PDFs ───────────────────────────────────────────────────────────────

@app.route("/api/upload", methods=["POST"])
def upload():
    if "files" not in request.files:
        return jsonify({"error": "No files provided"}), 400
    files = request.files.getlist("files")
    added = []
    errors = []
    for f in files:
        fname = f.filename or "unnamed.pdf"
        try:
            meta = research.add_pdf_doc(fname, f.read())
            added.append(meta)
        except Exception as e:
            errors.append({"filename": fname, "error": str(e)})
    return jsonify({"added": added, "errors": errors})


# ── Query (main pipeline) ─────────────────────────────────────────────────────

@app.route("/api/query", methods=["POST"])
def query():
    data = request.get_json(force=True)
    question = data.get("question", "").strip()
    wikipedia_mode = data.get("wikipedia_mode", False)
    if not question:
        return jsonify({"error": "question is required"}), 400
    try:
        result = research.research_assistant(question, wikipedia_mode=wikipedia_mode)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    print("🚀 Research Assistant backend starting on http://localhost:5050")
    app.run(host="0.0.0.0", port=5050, debug=False)
