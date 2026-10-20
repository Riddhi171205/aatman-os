from __future__ import annotations

from pathlib import Path
from urllib import error, request

from ..schemas import RetrievedItem
from ..vector_utils import cosine_similarity, embed_text
from .base import BaseEngine


class KnowledgeEngine(BaseEngine):
    """RAG over local documents, with a small external fetch helper."""

    def __init__(self, knowledge_dir: Path):
        super().__init__("KnowledgeEngine")
        self.knowledge_dir = knowledge_dir
        self.knowledge_dir.mkdir(parents=True, exist_ok=True)
        self.log(f"Initialized KnowledgeEngine with store at {self.knowledge_dir}")

    def ingest_text(self, name: str, content: str) -> Path:
        self.log(f"Ingesting text document: {name}", "info")
        safe_name = "".join(char if char.isalnum() or char in "-_." else "_" for char in name)
        path = self.knowledge_dir / safe_name
        path.write_text(content, encoding="utf-8")
        return path

    def ingest_file(self, path: Path) -> Path:
        self.log(f"Ingesting file: {path}", "info")
        if path.suffix.lower() == ".pdf":
            content = self._read_pdf(path)
            return self.ingest_text(f"{path.stem}.txt", content)
        content = path.read_text(encoding="utf-8", errors="ignore")
        return self.ingest_text(path.name, content)

    def retrieve(self, query: str, limit: int = 6) -> list[RetrievedItem]:
        self.log(f"Retrieving knowledge for query: {query}", "debug")
        query_vector = embed_text(query)
        ranked: list[RetrievedItem] = []

        for document in self.knowledge_dir.glob("**/*"):
            if not document.is_file():
                continue
            content = document.read_text(encoding="utf-8", errors="ignore")
            for index, chunk in enumerate(self._chunk(content)):
                score = cosine_similarity(query_vector, embed_text(chunk))
                if score > 0:
                    ranked.append(
                        RetrievedItem(
                            source=f"knowledge:{document.name}",
                            content=chunk,
                            score=score,
                            metadata={"path": str(document), "chunk": index},
                        )
                    )

        results = sorted(ranked, key=lambda item: item.score, reverse=True)[:limit]
        self.log(f"Retrieved {len(results)} knowledge chunks.")
        return results

    def fetch_url(self, url: str) -> str:
        self.log(f"Fetching external URL: {url}", "info")
        req = request.Request(url, headers={"User-Agent": "AATMAN-Brain/0.1"})
        try:
            with request.urlopen(req, timeout=12) as response:
                content_type = response.headers.get("content-type", "")
                body = response.read(200_000).decode("utf-8", errors="ignore")
                if "html" in content_type:
                    return self._strip_html(body)
                return body
        except (error.URLError, TimeoutError) as exc:
            self.log(f"External fetch failed for {url}: {exc}", "error")
            return f"External fetch failed: {exc}"

    def _chunk(self, content: str, size: int = 900, overlap: int = 120) -> list[str]:
        content = " ".join(content.split())
        if not content:
            return []
        chunks: list[str] = []
        start = 0
        while start < len(content):
            chunks.append(content[start : start + size])
            start += size - overlap
        return chunks

    def _read_pdf(self, path: Path) -> str:
        try:
            from pypdf import PdfReader
        except ImportError:
            self.log("pypdf not installed. PDF ingestion failed.", "warning")
            return "PDF ingestion requires optional dependency pypdf."

        reader = PdfReader(str(path))
        return "\n".join(page.extract_text() or "" for page in reader.pages)

    def _strip_html(self, html: str) -> str:
        import re

        text = re.sub(r"<(script|style).*?</\1>", " ", html, flags=re.I | re.S)
        text = re.sub(r"<[^>]+>", " ", text)
        return " ".join(text.split())
