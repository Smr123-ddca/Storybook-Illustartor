from fastapi import FastAPI, HTTPException
from dotenv import load_dotenv
import os
import requests
import time
from PIL import Image
from io import BytesIO

# Load environment variables
load_dotenv()

# Hugging Face API configuration
# Using Stable Diffusion v1.5 (most reliable on HF)
HF_API_URL = "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5"

def generate_image(prompt: str, filename: str) -> str:
    """
    Generate an image using Stable Diffusion via Hugging Face API.
    
    Args:
        prompt: Text description of the image to generate
        filename: Name to save the image as (e.g., "page_1.png")
    
    Returns:
        The filename of the saved image
    """
    token = os.getenv("HUGGINGFACE_TOKEN")
    headers = {"Authorization": f"Bearer {token}"}
    
    payload = {
        "inputs": prompt,
        "options": {"wait_for_model": True}
    }
    
    # Make request to Hugging Face
    response = requests.post(
        HF_API_URL,
        headers=headers,
        json=payload,
        timeout=60
    )
    
    print(f"Status Code: {response.status_code}")
    
    # Check if request was successful
    if response.status_code == 200:
        # Open and save the image
        image = Image.open(BytesIO(response.content))
        filepath = f"images/{filename}"
        image.save(filepath)
        return filename
    elif response.status_code == 503:
        raise HTTPException(
            status_code=503,
            detail="Model is loading, please wait 20 seconds and try again"
        )
    else:
        # Handle errors
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Image generation failed: {response.text}"
        )
    """
    Generate an image using Stable Diffusion via Hugging Face API.
    
    Args:
        prompt: Text description of the image to generate
        filename: Name to save the image as (e.g., "page_1.png")
    
    Returns:
        The filename of the saved image
    """
    token = os.getenv("HUGGINGFACE_TOKEN")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Make request to Hugging Face
    response = requests.post(
        HF_API_URL,
        headers=headers,
        json={"inputs": prompt},
        timeout=30
    )
    
    # Check if request was successful
    if response.status_code == 200:
        # Open and save the image
        image = Image.open(BytesIO(response.content))
        filepath = f"images/{filename}"
        image.save(filepath)
        return filename
    else:
        # Handle errors
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Image generation failed: {response.text}"
        )

# Create FastAPI app
app = FastAPI(
    title="Storybook Illustrator",
    description="Generate illustrations for your stories!",
    version="1.0.0"
)

# Test endpoint
@app.get("/")
def home():
    """Welcome message"""
    return {
        "message": "Welcome to Storybook Illustrator!",
        "status": "running"
    }

# Health check endpoint
@app.get("/health")
def health_check():
    """Check if API is working"""
    token = os.getenv("HUGGINGFACE_TOKEN")
    token_loaded = "Yes" if token else "No"
    
    return {
        "status": "healthy",
        "token_loaded": token_loaded
    }

from typing import List
from pydantic import BaseModel

# Request model
class StoryRequest(BaseModel):
    story_text: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "story_text": "Once upon a time, there was a brave knight.\n\nHe went on an adventure.\n\nThe end."
            }
        }

# Response model
class StoryResponse(BaseModel):
    pages: List[str]
    total_pages: int

# Story splitting endpoint
@app.post("/split-story", response_model=StoryResponse)
def split_story(request: StoryRequest):
    """
    Split a story into individual pages.
    
    Stories are split by double line breaks (\\n\\n).
    Each paragraph becomes one page.
    """
    # Split by double newlines (paragraphs)
    pages = request.story_text.split("\n\n")
    
    # Remove empty pages and strip whitespace
    pages = [page.strip() for page in pages if page.strip()]
    
    return {
        "pages": pages,
        "total_pages": len(pages)
    }

@app.post("/test-image")
def test_image_generation(prompt: str = "a cute cat in a garden, digital art"):
    """
    Test endpoint to generate a single image.
    Use this to verify Stable Diffusion is working!
    """
    try:
        print(f"Generating image with prompt: {prompt}")
        
        # Generate the image
        filename = generate_image(prompt, "test_image.png")
        
        return {
            "success": True,
            "message": "Image generated successfully!",
            "filename": filename,
            "path": f"images/{filename}"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }