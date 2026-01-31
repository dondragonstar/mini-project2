import os
import google.generativeai as genai
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini API
GENAI_KEY = os.getenv("GEMINI_API_KEY")
if not GENAI_KEY:
    print("Warning: GEMINI_API_KEY not found in .env file")

genai.configure(api_key=GENAI_KEY)

app = FastAPI(title="Content Studio AI")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MOCK DATABASE ---
users_db: Dict[str, dict] = {}
tokens_db: Dict[str, str] = {}

# --- DATA MODELS ---
class UserRegister(BaseModel):
    email: str
    username: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class GenerateRequest(BaseModel):
    brand_name: str
    topic: str
    objective: Optional[str] = "Engagement"
    target_audience: Optional[str] = "General"
    platform: Optional[str] = "Instagram"
    tone: Optional[str] = "Modern"
    art_style: Optional[str] = "Photorealistic"
    indian_context: Optional[str] = None
    color_palette: Optional[str] = None
    text_structure: Optional[str] = "Short Caption"
    level: int = 1

class GenerateResponse(BaseModel):
    script: str
    visual_prompt: str
    image_url: Optional[str] = None


# --- AUTH ENDPOINTS ---
@app.post("/register")
def register(user: UserRegister):
    if user.email in users_db:
        raise HTTPException(status_code=400, detail="Email already registered")
    users_db[user.email] = user.dict()
    return {"message": "Registration successful", "user": user.username}

@app.post("/login")
def login(user: UserLogin):
    stored_user = users_db.get(user.email)
    if not stored_user or stored_user["password"] != user.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = f"mock-token-{user.email}"
    tokens_db[token] = user.email
    return {"access_token": token, "token_type": "bearer", "username": stored_user["username"]}


# --- GENERATION ENDPOINT ---


# --- GENERATION ENDPOINT ---
def get_working_model():
    # Force stable model to avoid "candidates.content field unsupported" errors with experimental versions
    model_name = "gemini-flash-latest"
    try:
        model = genai.GenerativeModel(model_name)
        print(f"Selected Model: {model_name}")
        return model
    except Exception as e:
        print(f"Model {model_name} failed: {e}")
        # Fallback (unlikely to be needed if 1.5-flash fails)
        return genai.GenerativeModel("gemini-flash-latest")

def build_gemini_prompt(req: GenerateRequest) -> str:
    base_prompt = f"""
    Act as a senior social media manager and creative director for the Indian market.
    create marketing content for:
    Brand: {req.brand_name}
    Topic/Context: {req.topic}
    """
    
    if req.level >= 2:
        base_prompt += f"""
        Objective: {req.objective}
        Target Audience: {req.target_audience}
        Platform: {req.platform}
        Tone: {req.tone}
        """
        
    if req.level == 3:
        base_prompt += f"""
        Visual Art Style: {req.art_style}
        Text Structure: {req.text_structure}
        """
        if req.indian_context:
            base_prompt += f"Specific Cultural Context: {req.indian_context}\n"
        if req.color_palette:
            base_prompt += f"Color Palette: {req.color_palette}\n"

    base_prompt += """
    
    Please output the response in the following JSON format ONLY:
    {
        "script": "The text content/caption for the post. Make it engaging and relevant to the platform.",
        "image_prompt": "A highly detailed, creative prompt to generate an image/illustration for this post. describe shapes, colors, and composition."
    }
    
    IMPORTANT: 
    - Ensure the content is culturally relevant to India where appropriate. 
    - The 'script' should be in English (unless Hinglish is specifically requested in tone).
    - The 'image_prompt' should be descriptive and artistic.
    - Do NOT include markdown formatting (```json) in the response if possible, just the raw JSON string.
    """
    return base_prompt

async def generate_image_url(prompt):
    import urllib.parse
    encoded_prompt = urllib.parse.quote(prompt)
    return f"https://image.pollinations.ai/prompt/{encoded_prompt}?nologo=true"

@app.post("/generate")
async def generate_content(req: GenerateRequest):
    print(f"Generate Request (Level {req.level}): {req.brand_name}")
    
    try:
        # prompt = build_gemini_prompt(req)
        prompt = "Hello. Reply with JSON: {'script': 'hi', 'image_prompt': 'a cat'}"
        
        # Try models in sequence - gemini-flash-latest is verified working
        models = ["gemini-flash-latest", "gemini-1.5-flash-latest"]
        
        text_response = None
        last_error = None
        
        # Safety settings to avoid blocking
        safety_settings = [
            {
                "category": "HARM_CATEGORY_HARASSMENT",
                "threshold": "BLOCK_NONE"
            },
            {
                "category": "HARM_CATEGORY_HATE_SPEECH",
                "threshold": "BLOCK_NONE"
            },
            {
                "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                "threshold": "BLOCK_NONE"
            },
            {
                "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                "threshold": "BLOCK_NONE"
            },
        ]

        for model_name in models:
            try:
                print(f"Attempting with model: {model_name}")
                model = genai.GenerativeModel(model_name)
                
                response = model.generate_content(prompt, safety_settings=safety_settings)
                text_response = response.text
                print(f"Success with {model_name}")
                break
            except Exception as e:
                print(f"Failed with {model_name}: {e}")
                last_error = e
                continue
                
        if not text_response:
            raise HTTPException(status_code=500, detail=f"All models failed. Last error: {str(last_error)}")

        # Logging for debugging
        print(f"Gemini Response: {text_response[:100]}...")
        
        import json
        clean_text = text_response.replace("```json", "").replace("```", "").strip()
        
        script = "Error generating script."
        visual_prompt = "Error generating visual prompt."
        
        try:
            data = json.loads(clean_text)
            script = data.get("script", script)
            visual_prompt = data.get("image_prompt", visual_prompt)
        except json.JSONDecodeError:
            print("JSON Parse Error. Raw:", text_response)
            script = text_response
            
        # Generate Image URL
        print("Generating Image URL...")
        image_url = await generate_image_url(visual_prompt)
        
        with open("debug_flow.txt", "w") as f:
            f.write(f"Returning: {script[:20]}... {image_url}")

        return GenerateResponse(
            script=script,
            visual_prompt=visual_prompt,
            image_url=image_url
        )
            
    except Exception as e:
        import traceback
        err_msg = traceback.format_exc()
        print("Backend Critical Error:", e)
        log_path = r"c:\Users\devaj\mini-project2\mini-project-temp\backend\backend_error.log"
        try:
            with open(log_path, "w") as f:
                f.write(err_msg)
        except:
            pass
        # Return a meaningful error to the frontend
        raise HTTPException(status_code=500, detail=f"Backend Error: {str(e)}")

@app.get("/")
def read_root():
    return {"message": "Content Studio AI Backend is Running"}
