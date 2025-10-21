"""
LLM service for AI-Learning API.
Handles all interactions with Ollama cloud for flashcard generation.
"""

from typing import List
import json
import re
import logging

from ollama import Client

from config import settings
from models import Flashcard, MultipleChoiceQuestion, TrueFalseQuestion, ShortAnswerQuestion

logger = logging.getLogger(__name__)


class LLMService:
    """Service for interacting with Language Learning Models (Ollama)."""
    
    def __init__(self):
        """Initialize the LLM service with Ollama client."""
        self.client = Client(
            host=settings.OLLAMA_HOST,
            headers=settings.ollama_headers
        )
        self.model = settings.OLLAMA_MODEL
    
    def generate_flashcards(self, text: str, num_cards: int = None) -> List[Flashcard]:
        """
        Generate flashcards from provided text using Ollama.
        
        Args:
            text: Source text to generate flashcards from
            num_cards: Number of flashcards to generate (uses default if None)
            
        Returns:
            List of validated Flashcard objects
            
        Raises:
            ValueError: If generation or parsing fails
        """
        if num_cards is None:
            num_cards = settings.DEFAULT_FLASHCARD_COUNT
        
        logger.info(f"Generating {num_cards} flashcards from {len(text)} characters")
        
        try:
            # Build the prompt
            prompt = self._build_flashcard_prompt(text, num_cards)
            
            # Call Ollama API
            response_text = self._call_ollama_api(prompt)
            
            # Parse and validate response
            flashcards = self._parse_flashcard_response(response_text)
            
            # Validate we got flashcards
            if len(flashcards) == 0:
                raise ValueError("No flashcards were generated. The AI response was empty or invalid.")
            
            logger.info(f"Successfully generated {len(flashcards)} flashcards")
            return flashcards
            
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Unexpected error in flashcard generation: {str(e)}", exc_info=True)
            raise ValueError(f"Flashcard generation failed: {str(e)}")
    
    def _build_flashcard_prompt(self, text: str, num_cards: int) -> str:
        """
        Build the prompt for flashcard generation.
        
        Args:
            text: Source text
            num_cards: Number of flashcards to generate
            
        Returns:
            Formatted prompt string
        """
        # Truncate text if too long (LLMs have context limits)
        max_text_length = 5000
        truncated_text = text[:max_text_length] if len(text) > max_text_length else text
        
        prompt = f"""Generate exactly {num_cards} educational flashcards from the following text.

IMPORTANT: Return ONLY a JSON array of objects. Each object must have exactly two fields:
- "question": A clear, specific question
- "answer": A concise, accurate answer

Format example:
[
  {{"question": "What is...", "answer": "It is..."}},
  {{"question": "How does...", "answer": "It works by..."}}
]

Text to analyze:
{truncated_text}
"""
        return prompt
    
    def _call_ollama_api(self, prompt: str) -> str:
        """
        Call Ollama API with the given prompt.
        
        Args:
            prompt: The prompt to send
            
        Returns:
            Raw response text from Ollama
            
        Raises:
            ValueError: If API call fails
        """
        messages = [{"role": "user", "content": prompt}]
        response_text = ""
        
        try:
            # Stream response from Ollama
            for part in self.client.chat(self.model, messages=messages, stream=True):
                response_text += part["message"]["content"]
            
            return response_text
            
        except Exception as e:
            logger.error(f"Ollama API call failed: {str(e)}")
            raise ValueError(f"Failed to communicate with AI service: {str(e)}")
    
    def _parse_flashcard_response(self, response_text: str) -> List[Flashcard]:
        """
        Parse Ollama response into validated Flashcard objects.
        Handles responses with or without markdown code blocks.
        
        Args:
            response_text: Raw text response from Ollama
            
        Returns:
            List of validated Flashcard objects
            
        Raises:
            ValueError: If response cannot be parsed into valid flashcards
        """
        # Remove markdown code blocks if present
        cleaned_text = self._clean_markdown(response_text)
        
        # Extract JSON array from response
        json_text = self._extract_json_array(cleaned_text)
        
        # Parse JSON
        try:
            data = json.loads(json_text)
        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing failed: {str(e)}\nResponse: {response_text[:500]}")
            raise ValueError("AI returned invalid response format. Please try again.")
        
        # Handle different response structures
        data = self._normalize_response_structure(data)
        
        # Validate and convert to Flashcard objects
        flashcards = self._convert_to_flashcards(data)
        
        if len(flashcards) == 0:
            raise ValueError("No valid flashcards could be extracted from AI response")
        
        return flashcards
    
    @staticmethod
    def _clean_markdown(text: str) -> str:
        """Remove markdown code blocks from text."""
        cleaned = re.sub(r'```(?:json)?\s*\n?', '', text)
        cleaned = cleaned.replace('```', '').strip()
        return cleaned
    
    @staticmethod
    def _extract_json_array(text: str) -> str:
        """Extract JSON array pattern from text."""
        # Try to find JSON array in the response like [{...}, {...}]
        json_match = re.search(r'\[\s*\{.*?\}\s*\]', text, re.DOTALL)
        if json_match:
            return json_match.group(0)
        return text
    
    @staticmethod
    def _normalize_response_structure(data) -> list:
        """Normalize different response structures to a list."""
        if isinstance(data, dict):
            # Response might be {"flashcards": [...]}
            if "flashcards" in data:
                return data["flashcards"]
            else:
                raise ValueError("Unexpected response structure from AI")
        
        if not isinstance(data, list):
            raise ValueError("AI response is not a list of flashcards")
        
        return data
    
    @staticmethod
    def _convert_to_flashcards(data: list) -> List[Flashcard]:
        """
        Convert list of dictionaries to validated Flashcard objects.
        
        Args:
            data: List of flashcard dictionaries
            
        Returns:
            List of validated Flashcard objects
        """
        flashcards = []
        
        for i, item in enumerate(data):
            try:
                if not isinstance(item, dict):
                    logger.warning(f"Skipping invalid flashcard at index {i}: not a dict")
                    continue
                
                # Extract question and answer
                question = item.get("question", "").strip()
                answer = item.get("answer", "").strip()
                
                if not question or not answer:
                    logger.warning(f"Skipping flashcard at index {i}: missing question or answer")
                    continue
                
                # Create and validate flashcard
                flashcard = Flashcard(question=question, answer=answer)
                flashcards.append(flashcard)
                
            except Exception as e:
                logger.warning(f"Failed to parse flashcard at index {i}: {str(e)}")
                continue
        
        return flashcards


# Singleton instance
_llm_service_instance = None


def get_llm_service() -> LLMService:
    """
    Get or create the singleton LLM service instance.
    
    Returns:
        LLM service instance
    """
    global _llm_service_instance
    if _llm_service_instance is None:
        _llm_service_instance = LLMService()
    return _llm_service_instance


# Convenience function for backward compatibility
def generate_flashcards_with_ollama(text: str, num_cards: int = None) -> List[Flashcard]:
    """
    Generate flashcards using Ollama. Wrapper function.
    
    Args:
        text: Source text
        num_cards: Number of flashcards to generate
        
    Returns:
        List of Flashcard objects
    """
    service = get_llm_service()
    return service.generate_flashcards(text, num_cards)