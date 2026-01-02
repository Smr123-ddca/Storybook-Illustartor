from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from dotenv import load_dotenv
import os
from typing import List
from pydantic import BaseModel
import requests
from PIL import Image
from io import BytesIO
import urllib.parse
import time
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="Storybook Illustrator",
    description="Generatinh AI illustrations for stories ",
)


# ADD THIS - Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (for development)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/images", StaticFiles(directory="images"), name="images")

def generate_image(prompt: str, filename: str) -> str:
    # Make prompt URL-safe
    encoded_prompt = urllib.parse.quote(prompt)
    
    # Pollinations API endpoint - FREE!
    url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=768&height=768&model=flux&nologo=true"
    
    print(f" Generating image: {prompt[:80]}...")
    
    try:
        # Request the image
        response = requests.get(url, timeout=90)
        
        if response.status_code == 200:
            # Open and save the image
            image = Image.open(BytesIO(response.content))
            filepath = f"images/{filename}"
            image.save(filepath)
            print(f" Image saved to: {filepath}")
            return filename
        else:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Image generation failed with status {response.status_code}"
            )
            
    except requests.exceptions.Timeout:
        raise HTTPException(
            status_code=504,
            detail="Request timed out. Try again."
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating image: {str(e)}"
        )


def create_image_prompt(page_text: str, page_number: int) -> str:
    short_text = page_text[:200]
    prompt = f"{short_text}, children's book illustration, colorful, whimsical, storybook art style, detailed"
    return prompt


# ==================== ENDPOINTS ====================

@app.get("/")
def home():
    """Welcome endpoint"""
    return {
        "message": "Welcome to Storybook Illustrator!",
        "status": "running",
        "powered_by": "Pollinations.ai ",
        "endpoints": {
            "docs": "/docs",
            "health": "/health",
            "split_story": "/split-story",
            "test_image": "/test-image",
            "generate_storybook": "/generate-storybook >> MAIN FEATURE <<"
        }
    }


@app.get("/health")
def health_check():
    """Check if API is working"""
    return {
        "status": "healthy",
        "api": "Pollinations.ai",
        "cost": "FREE! 🎉",
        "signup_required": "NO! 🚀"
    }


# ==================== PYDANTIC MODELS ====================

class StoryRequest(BaseModel):
    story_text: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "story_text": "Once upon a time, there was a brave knight.\n\nHe went on an adventure to find a dragon.\n\nHe found the dragon and they became friends.\n\nThe end."
            }
        }


class StoryResponse(BaseModel):
    pages: List[str]
    total_pages: int


class ImageInfo(BaseModel):
    page_number: int
    page_text: str
    image_filename: str
    image_path: str


class StorybookResponse(BaseModel):
    story_title: str
    total_pages: int
    images: List[ImageInfo]
    generation_time: str


# ==================== STORY ENDPOINTS ====================

@app.post("/split-story", response_model=StoryResponse)
def split_story(request: StoryRequest):
    """
    Split a story into individual pages.
    """
    
    pages = request.story_text.split("\n\n")
    pages = [page.strip() for page in pages if page.strip()]
    
    print(f" Story split into {len(pages)} pages")
    
    return {
        "pages": pages,
        "total_pages": len(pages)
    }


# ==================== IMAGE ENDPOINTS ====================

@app.post("/test-image")
def test_image_generation(prompt: str = "a cute cat in a magical garden, children's book illustration style, colorful, whimsical"):
    try:
        print(f" Testing image generation...")
        
        filename = generate_image(prompt, "test_image.png")
        
        return {
            "success": True,
            "message": "Image generated successfully! ",
            "filename": filename,
            "path": f"images/{filename}",
            "view_at": f"http://localhost:8000/images/{filename}"
        }
        
    except HTTPException as e:
        return {
            "success": False,
            "error": e.detail,
            "status_code": e.status_code
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.post("/generate-storybook", response_model=StorybookResponse)
def generate_storybook(request: StoryRequest, title: str = "My Storybook"):
    """
    Generates each page individually to avoid timeouts.
    """
    
    start_time = time.time()
    
    print(f"\n{'='*60}")
    print(f"📚 Starting storybook generation: '{title}'")
    print(f"{'='*60}\n")
    
    try:
        # Step 1: Split story into pages
        pages = request.story_text.split("\n\n")
        pages = [page.strip() for page in pages if page.strip()]
        
        total_pages = len(pages)
        print(f" Story has {total_pages} pages")
        
        if total_pages == 0:
            raise HTTPException(
                status_code=400,
                detail="Story is empty! Please provide some text."
            )
        
        if total_pages > 15:
            raise HTTPException(
                status_code=400,
                detail=f"Story has {total_pages} pages. Maximum is 15 pages. Try making your paragraphs longer!"
            )
        
        # Step 2: Generate images ONE AT A TIME (to avoid timeouts)
        images_info = []
        successful_pages = 0
        failed_pages = 0
        
        for i, page_text in enumerate(pages, start=1):
            print(f"\n{'─'*60}")
            print(f" Processing page {i}/{total_pages}")
            print(f" Text: {page_text[:100]}...")
            print(f"{'─'*60}")
            
            try:
                # Create a detailed prompt with MORE context (up to 400 chars)
                prompt = create_detailed_prompt(page_text, i, total_pages)
                
                # Generate the image
                filename = f"page_{i}.png"
                
                print(f" Generating image... (this takes 10-20 seconds)")
                generate_image(prompt, filename)
                
                # Store the info
                images_info.append({
                    "page_number": i,
                    "page_text": page_text,
                    "image_filename": filename,
                    "image_path": f"images/{filename}"
                })
                
                successful_pages += 1
                print(f" Page {i}/{total_pages} complete!")
                
                # Small delay between requests to be nice to the API
                if i < total_pages:
                    print(f"⏸️  Waiting 2 seconds before next page...")
                    time.sleep(2)
                
            except Exception as e:
                failed_pages += 1
                error_msg = str(e)
                print(f" Failed to generate page {i}: {error_msg}")
                
                # Add error placeholder
                images_info.append({
                    "page_number": i,
                    "page_text": page_text,
                    "image_filename": "error",
                    "image_path": f"Error: {error_msg[:100]}"
                })
                
                # Continue with next page
                continue
        
        # Calculate total time
        end_time = time.time()
        duration = round(end_time - start_time, 2)
        minutes = int(duration // 60)
        seconds = int(duration % 60)
        
        print(f"\n{'='*60}")
        print(f"STORYBOOK GENERATION COMPLETE!")
        print(f"Successfully generated: {successful_pages}/{total_pages} pages")
        if failed_pages > 0:
            print(f"❌ Failed pages: {failed_pages}")
        print(f" Total time: {minutes}m {seconds}s")
        print(f"{'='*60}\n")
        
        if successful_pages == 0:
            raise HTTPException(
                status_code=500,
                detail="Failed to generate any images. Please try again."
            )
        
        return {
            "story_title": title,
            "total_pages": total_pages,
            "images": images_info,
            "generation_time": f"{minutes}m {seconds}s ({successful_pages}/{total_pages} successful)"
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating storybook: {str(e)}"
        )


def create_detailed_prompt(page_text: str, page_number: int, total_pages: int) -> str:
    
    # Take MORE context - up to 400 characters
    context = page_text[:400].strip()
    
    # Add position-based style hints
    if page_number == 1:
        style = "opening scene, establishing shot"
    elif page_number == total_pages:
        style = "final scene, conclusion"
    else:
        style = "story scene"
    
    # Create detailed prompt
    prompt = f"{context}, {style}, children's book illustration, vibrant colors, whimsical, storybook art, detailed, high quality"
    
    print(f" Prompt length: {len(prompt)} characters")
    
    return prompt


