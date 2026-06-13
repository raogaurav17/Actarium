import hashlib
import json
import logging
from pathlib import Path

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from config import get_settings, TOPICS
from pipeline.embedder import get_vector_store

logger = logging.getLogger(__name__)

def _hash_file(filepath: Path) -> str:
    """Return SHA256 hash of a file's contents."""
    h = hashlib.sha256()
    h.update(filepath.read_bytes())
    return h.hexdigest()

def sync_vector_db() -> None:
    """Sync vector DB with raw data files."""
    logger.info("Starting Vector DB sync...")
    settings = get_settings()
    raw_dir = Path(settings.raw_data_dir)
    state_file = raw_dir.parent / "ingest_state.json"
    
    # Load previous state
    state: dict[str, str] = {}
    if state_file.exists():
        try:
            state = json.loads(state_file.read_text(encoding="utf-8"))
        except Exception:
            logger.warning("Failed to parse ingest_state.json, starting fresh.")
            
    try:
        store = get_vector_store()
    except Exception as e:
        logger.error("Failed to initialize vector store: %s", e)
        return

    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    current_state: dict[str, str] = {}
    
    for topic in TOPICS:
        slug = topic["slug"]
        filepath = raw_dir / f"{slug}.txt"
        
        if not filepath.exists():
            if slug in state:
                logger.info("Topic %s removed, deleting from Vector DB", slug)
                _delete_from_chroma(store, slug)
            continue
            
        file_hash = _hash_file(filepath)
        current_state[slug] = file_hash
        
        if state.get(slug) == file_hash:
            logger.debug("Topic %s unchanged, skipping ingestion", slug)
            continue
            
        logger.info("Topic %s is new or modified, ingesting...", slug)
        
        if slug in state:
            _delete_from_chroma(store, slug)
            
        text = filepath.read_text(encoding="utf-8")
        doc = Document(
            page_content=text,
            metadata={
                "topic_slug": slug,
                "source": topic.get("source_url", str(filepath))
            }
        )
        chunks = splitter.split_documents([doc])
        
        if chunks:
            store.add_documents(chunks)
            logger.info("Ingested %d chunks for topic %s", len(chunks), slug)
            
    for old_slug in list(state.keys()):
        if old_slug not in current_state:
            logger.info("Topic %s no longer tracked, deleting from Vector DB", old_slug)
            _delete_from_chroma(store, old_slug)
            
    state_file.write_text(json.dumps(current_state, indent=2), encoding="utf-8")
    logger.info("Vector DB sync complete.")

def _delete_from_chroma(store, topic_slug: str) -> None:
    try:
        results = store.get(where={"topic_slug": topic_slug})
        if results and results.get("ids"):
            store.delete(ids=results["ids"])
            logger.info("Deleted %d existing chunks for topic %s", len(results["ids"]), topic_slug)
    except Exception as e:
        logger.warning("Could not delete old docs for %s: %s", topic_slug, e)

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    sync_vector_db()
