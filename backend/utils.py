from typing import List


def chunk_text(text: str, max_chars: int = 500) -> List[str]:
    """
    Placeholder chunker that splits text every max_chars characters.
    """
    if not text:
        return []
    chunks: List[str] = []
    for i in range(0, len(text), max_chars):
        chunks.append(text[i : i + max_chars])
    return chunks


