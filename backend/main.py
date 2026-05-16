import os
import json
import uuid
import sqlite3
import hashlib
import secrets
import urllib.parse
import base64
import traceback
from datetime import datetime, timedelta
from contextlib import contextmanager

import requests
import google.generativeai as genai
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List
from dotenv import load_dotenv

# ---------- ENV ----------
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
GENAI_KEY = os.getenv("GEMINI_API_KEY")
POLLINATIONS_API_KEY = os.getenv("POLLINATIONS_API_KEY")
JWT_SECRET = os.getenv("JWT_SECRET", secrets.token_hex(32))
DATABASE_PATH = os.path.join(os.path.dirname(__file__), "content_studio.db")

if GENAI_KEY:
    genai.configure(api_key=GENAI_KEY)

# ---------- DATABASE ----------
def get_db():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            xp INTEGER DEFAULT 0,
            level INTEGER DEFAULT 1,
            badges TEXT DEFAULT '[]',
            streak_current INTEGER DEFAULT 0,
            streak_best INTEGER DEFAULT 0,
            streak_last_date TEXT DEFAULT '',
            created_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS brands (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            industry TEXT DEFAULT '',
            default_tone TEXT DEFAULT 'Modern',
            default_audience TEXT DEFAULT 'General',
            default_platform TEXT DEFAULT 'Instagram',
            color_palette TEXT DEFAULT '',
            brand_voice_keywords TEXT DEFAULT '',
            logo_url TEXT DEFAULT '',
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS generations (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            brand_name TEXT DEFAULT '',
            topic TEXT DEFAULT '',
            platform TEXT DEFAULT '',
            tone TEXT DEFAULT '',
            level INTEGER DEFAULT 1,
            script TEXT DEFAULT '',
            visual_prompt TEXT DEFAULT '',
            image_url TEXT DEFAULT '',
            share_id TEXT UNIQUE,
            is_evergreen INTEGER DEFAULT 0,
            recycle_days INTEGER DEFAULT 0,
            status TEXT DEFAULT 'published',
            campaign_id TEXT DEFAULT '',
            scheduled_date TEXT DEFAULT '',
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS analytics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            action TEXT NOT NULL,
            metadata TEXT DEFAULT '{}',
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS campaigns (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT DEFAULT '',
            brand_name TEXT DEFAULT '',
            status TEXT DEFAULT 'draft',
            start_date TEXT DEFAULT '',
            end_date TEXT DEFAULT '',
            template_type TEXT DEFAULT 'custom',
            posts_data TEXT DEFAULT '[]',
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS approvals (
            id TEXT PRIMARY KEY,
            generation_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            status TEXT DEFAULT 'draft',
            reviewer_notes TEXT DEFAULT '',
            submitted_at TEXT DEFAULT '',
            reviewed_at TEXT DEFAULT '',
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (generation_id) REFERENCES generations(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    """)
    conn.commit()
    conn.close()

# ---------- AUTH HELPERS ----------
def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
    return f"{salt}:{hashed.hex()}"

def verify_password(password: str, stored: str) -> bool:
    salt, hashed = stored.split(':')
    check = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
    return check.hex() == hashed

def create_token(user_id: str, username: str) -> str:
    import hmac
    payload = json.dumps({
        "user_id": user_id,
        "username": username,
        "exp": (datetime.utcnow() + timedelta(days=7)).isoformat()
    })
    payload_b64 = base64.urlsafe_b64encode(payload.encode()).decode()
    signature = hmac.new(JWT_SECRET.encode(), payload_b64.encode(), hashlib.sha256).hexdigest()
    return f"{payload_b64}.{signature}"

def decode_token(token: str) -> dict:
    import hmac
    try:
        payload_b64, signature = token.rsplit('.', 1)
        expected = hmac.new(JWT_SECRET.encode(), payload_b64.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected):
            raise ValueError("Invalid signature")
        payload = json.loads(base64.urlsafe_b64decode(payload_b64))
        if datetime.fromisoformat(payload["exp"]) < datetime.utcnow():
            raise ValueError("Token expired")
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

security = HTTPBearer(auto_error=False)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return decode_token(credentials.credentials)

def get_optional_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        return None
    try:
        return decode_token(credentials.credentials)
    except:
        return None

# ---------- RATE LIMITER ----------
rate_limit_store = {}

def check_rate_limit(key: str, max_calls: int = 30, window_seconds: int = 60):
    now = datetime.utcnow()
    if key not in rate_limit_store:
        rate_limit_store[key] = []
    rate_limit_store[key] = [t for t in rate_limit_store[key] if (now - t).total_seconds() < window_seconds]
    if len(rate_limit_store[key]) >= max_calls:
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again shortly.")
    rate_limit_store[key].append(now)

# ---------- DATA MODELS ----------
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
    variations: int = 1  # A/B mode: 1-3

class ImageGenerateRequest(BaseModel):
    prompt: str

class BrandCreate(BaseModel):
    name: str
    industry: Optional[str] = ""
    default_tone: Optional[str] = "Modern"
    default_audience: Optional[str] = "General"
    default_platform: Optional[str] = "Instagram"
    color_palette: Optional[str] = ""

class BrandUpdate(BaseModel):
    name: Optional[str] = None
    industry: Optional[str] = None
    default_tone: Optional[str] = None
    default_audience: Optional[str] = None
    default_platform: Optional[str] = None
    color_palette: Optional[str] = None

# ---------- APP ----------
app = FastAPI(title="Content Studio AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    init_db()

# ---------- AUTH ----------
@app.post("/register")
def register(user: UserRegister):
    conn = get_db()
    try:
        existing = conn.execute("SELECT id FROM users WHERE email = ?", (user.email,)).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        user_id = str(uuid.uuid4())
        conn.execute(
            "INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)",
            (user_id, user.username, user.email, hash_password(user.password))
        )
        conn.commit()
        # Track analytics
        conn.execute("INSERT INTO analytics (user_id, action, metadata) VALUES (?, ?, ?)",
                      (user_id, "register", "{}"))
        conn.commit()
        return {"message": "Registration successful", "user": user.username}
    finally:
        conn.close()

@app.post("/login")
def login(user: UserLogin):
    conn = get_db()
    try:
        row = conn.execute("SELECT * FROM users WHERE email = ?", (user.email,)).fetchone()
        if not row or not verify_password(user.password, row["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        token = create_token(row["id"], row["username"])
        # Track analytics
        conn.execute("INSERT INTO analytics (user_id, action) VALUES (?, ?)", (row["id"], "login"))
        conn.commit()
        return {"access_token": token, "token_type": "bearer", "username": row["username"]}
    finally:
        conn.close()

# ---------- BRAND PROFILES ----------
@app.get("/brands")
def list_brands(user=Depends(get_current_user)):
    conn = get_db()
    try:
        rows = conn.execute("SELECT * FROM brands WHERE user_id = ? ORDER BY created_at DESC", (user["user_id"],)).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()

@app.post("/brands")
def create_brand(brand: BrandCreate, user=Depends(get_current_user)):
    conn = get_db()
    try:
        brand_id = str(uuid.uuid4())
        conn.execute(
            "INSERT INTO brands (id, user_id, name, industry, default_tone, default_audience, default_platform, color_palette) VALUES (?,?,?,?,?,?,?,?)",
            (brand_id, user["user_id"], brand.name, brand.industry, brand.default_tone, brand.default_audience, brand.default_platform, brand.color_palette)
        )
        conn.commit()
        return {"id": brand_id, "message": "Brand created"}
    finally:
        conn.close()

@app.put("/brands/{brand_id}")
def update_brand(brand_id: str, brand: BrandUpdate, user=Depends(get_current_user)):
    conn = get_db()
    try:
        existing = conn.execute("SELECT * FROM brands WHERE id = ? AND user_id = ?", (brand_id, user["user_id"])).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Brand not found")
        updates = {k: v for k, v in brand.dict().items() if v is not None}
        if updates:
            set_clause = ", ".join(f"{k} = ?" for k in updates.keys())
            conn.execute(f"UPDATE brands SET {set_clause} WHERE id = ?", (*updates.values(), brand_id))
            conn.commit()
        return {"message": "Brand updated"}
    finally:
        conn.close()

@app.delete("/brands/{brand_id}")
def delete_brand(brand_id: str, user=Depends(get_current_user)):
    conn = get_db()
    try:
        conn.execute("DELETE FROM brands WHERE id = ? AND user_id = ?", (brand_id, user["user_id"]))
        conn.commit()
        return {"message": "Brand deleted"}
    finally:
        conn.close()

# ---------- CONTENT GENERATION ----------
def build_gemini_prompt(req: GenerateRequest) -> str:
    num_variations = min(max(req.variations, 1), 3)
    
    base_prompt = f"""
    Act as a senior social media manager and creative director for the Indian market.
    Create marketing content for:
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

    if num_variations > 1:
        base_prompt += f"""
    
    Generate {num_variations} DIFFERENT variations of the content. Each variation should have a distinct creative angle.
    
    Output JSON format:
    {{
        "variations": [
            {{
                "script": "Variation 1 text content...",
                "image_prompt": "Variation 1 image prompt..."
            }},
            {{
                "script": "Variation 2 text content...",
                "image_prompt": "Variation 2 image prompt..."
            }}
        ]
    }}
    """
    else:
        base_prompt += """
    
    Please output the response in the following JSON format ONLY:
    {
        "script": "The text content/caption for the post. Make it engaging and relevant to the platform.",
        "image_prompt": "A highly detailed, creative prompt to generate an image/illustration for this post. describe shapes, colors, and composition."
    }
    """

    base_prompt += """
    IMPORTANT: 
    - Ensure the content is culturally relevant to India where appropriate. 
    - The 'script' should be in English (unless Hinglish is specifically requested in tone).
    - The 'image_prompt' should be descriptive and artistic.
    - Do NOT include markdown formatting (```json) in the response, just the raw JSON string.
    """
    return base_prompt

async def generate_image_url(prompt: str) -> Optional[str]:
    if not POLLINATIONS_API_KEY:
        return None
    prompt_encoded = urllib.parse.quote(prompt)
    API_URL = f"https://gen.pollinations.ai/image/{prompt_encoded}?model=flux"
    headers = {"Authorization": f"Bearer {POLLINATIONS_API_KEY}"}
    try:
        response = requests.get(API_URL, headers=headers, timeout=60)
        if response.status_code != 200:
            return None
        image_bytes = response.content
        base64_image = base64.b64encode(image_bytes).decode('utf-8')
        return f"data:image/jpeg;base64,{base64_image}"
    except Exception as e:
        print(f"Image gen failed: {e}")
        return None

@app.post("/generate")
async def generate_content(req: GenerateRequest, request: Request, user=Depends(get_current_user)):
    check_rate_limit(user["user_id"], max_calls=20, window_seconds=60)
    
    if not GENAI_KEY:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")
    
    try:
        prompt = build_gemini_prompt(req)
        num_variations = min(max(req.variations, 1), 3)
        
        safety_settings = [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
        ]

        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt, safety_settings=safety_settings)
        text_response = response.text
        
        clean_text = text_response.replace("```json", "").replace("```", "").strip()
        
        conn = get_db()
        try:
            if num_variations > 1:
                data = json.loads(clean_text)
                variations = data.get("variations", [])
                results = []
                for v in variations:
                    gen_id = str(uuid.uuid4())
                    share_id = secrets.token_urlsafe(8)
                    script = v.get("script", "")
                    visual_prompt = v.get("image_prompt", "")
                    image_url = await generate_image_url(visual_prompt)
                    
                    conn.execute(
                        "INSERT INTO generations (id, user_id, brand_name, topic, platform, tone, level, script, visual_prompt, image_url, share_id) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                        (gen_id, user["user_id"], req.brand_name, req.topic, req.platform, req.tone, req.level, script, visual_prompt, image_url or "", share_id)
                    )
                    results.append({
                        "id": gen_id,
                        "script": script,
                        "visual_prompt": visual_prompt,
                        "image_url": image_url,
                        "share_id": share_id
                    })
                conn.commit()
                
                # Track analytics
                conn.execute("INSERT INTO analytics (user_id, action, metadata) VALUES (?, ?, ?)",
                    (user["user_id"], "generate", json.dumps({"brand": req.brand_name, "platform": req.platform, "variations": num_variations})))
                conn.commit()
                
                return {"variations": results}
            else:
                data = json.loads(clean_text)
                script = data.get("script", text_response)
                visual_prompt = data.get("image_prompt", "")
                
                image_url = await generate_image_url(visual_prompt)
                
                gen_id = str(uuid.uuid4())
                share_id = secrets.token_urlsafe(8)
                conn.execute(
                    "INSERT INTO generations (id, user_id, brand_name, topic, platform, tone, level, script, visual_prompt, image_url, share_id) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                    (gen_id, user["user_id"], req.brand_name, req.topic, req.platform, req.tone, req.level, script, visual_prompt, image_url or "", share_id)
                )
                conn.commit()
                
                # Track analytics
                conn.execute("INSERT INTO analytics (user_id, action, metadata) VALUES (?, ?, ?)",
                    (user["user_id"], "generate", json.dumps({"brand": req.brand_name, "platform": req.platform})))
                conn.commit()
                
                return {
                    "id": gen_id,
                    "script": script,
                    "visual_prompt": visual_prompt,
                    "image_url": image_url,
                    "share_id": share_id
                }
        finally:
            conn.close()
            
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse AI response")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation error: {str(e)}")

# ---------- IMAGE GENERATION ----------
@app.post("/generate-image")
async def generate_image(req: ImageGenerateRequest, user=Depends(get_current_user)):
    check_rate_limit(user["user_id"], max_calls=10, window_seconds=60)
    
    if not POLLINATIONS_API_KEY:
        raise HTTPException(status_code=500, detail="Pollinations API Key is missing")
    
    prompt_encoded = urllib.parse.quote(req.prompt)
    API_URL = f"https://gen.pollinations.ai/image/{prompt_encoded}?model=flux"
    headers = {"Authorization": f"Bearer {POLLINATIONS_API_KEY}"}

    try:
        response = requests.get(API_URL, headers=headers, timeout=60)
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=f"Pollinations API Error")
        image_bytes = response.content
        base64_image = base64.b64encode(image_bytes).decode('utf-8')
        return {"image_base64": base64_image}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------- HISTORY ----------
@app.get("/history")
def get_history(user=Depends(get_current_user), limit: int = 50, offset: int = 0, brand: str = None, platform: str = None):
    conn = get_db()
    try:
        query = "SELECT * FROM generations WHERE user_id = ?"
        params = [user["user_id"]]
        if brand:
            query += " AND brand_name LIKE ?"
            params.append(f"%{brand}%")
        if platform:
            query += " AND platform LIKE ?"
            params.append(f"%{platform}%")
        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        rows = conn.execute(query, params).fetchall()
        total = conn.execute("SELECT COUNT(*) FROM generations WHERE user_id = ?", (user["user_id"],)).fetchone()[0]
        return {"items": [dict(r) for r in rows], "total": total}
    finally:
        conn.close()

@app.get("/history/{gen_id}")
def get_generation(gen_id: str, user=Depends(get_current_user)):
    conn = get_db()
    try:
        row = conn.execute("SELECT * FROM generations WHERE id = ? AND user_id = ?", (gen_id, user["user_id"])).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Generation not found")
        return dict(row)
    finally:
        conn.close()

@app.delete("/history/{gen_id}")
def delete_generation(gen_id: str, user=Depends(get_current_user)):
    conn = get_db()
    try:
        conn.execute("DELETE FROM generations WHERE id = ? AND user_id = ?", (gen_id, user["user_id"]))
        conn.commit()
        return {"message": "Deleted"}
    finally:
        conn.close()

# ---------- SHARING ----------
@app.get("/share/{share_id}")
def get_shared(share_id: str):
    """Public endpoint - no auth required"""
    conn = get_db()
    try:
        row = conn.execute("SELECT script, visual_prompt, image_url, brand_name, platform, created_at FROM generations WHERE share_id = ?", (share_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Shared content not found")
        return dict(row)
    finally:
        conn.close()

# ---------- ANALYTICS ----------
@app.get("/analytics")
def get_analytics(user=Depends(get_current_user)):
    conn = get_db()
    try:
        uid = user["user_id"]
        total_gens = conn.execute("SELECT COUNT(*) FROM generations WHERE user_id = ?", (uid,)).fetchone()[0]
        
        # Generations per platform
        platform_rows = conn.execute(
            "SELECT platform, COUNT(*) as count FROM generations WHERE user_id = ? GROUP BY platform ORDER BY count DESC",
            (uid,)
        ).fetchall()
        
        # Generations per brand
        brand_rows = conn.execute(
            "SELECT brand_name, COUNT(*) as count FROM generations WHERE user_id = ? GROUP BY brand_name ORDER BY count DESC LIMIT 10",
            (uid,)
        ).fetchall()
        
        # Generations over time (last 30 days)
        timeline = conn.execute(
            "SELECT date(created_at) as day, COUNT(*) as count FROM generations WHERE user_id = ? AND created_at >= date('now', '-30 days') GROUP BY day ORDER BY day",
            (uid,)
        ).fetchall()
        
        # Generations by tone
        tone_rows = conn.execute(
            "SELECT tone, COUNT(*) as count FROM generations WHERE user_id = ? GROUP BY tone ORDER BY count DESC",
            (uid,)
        ).fetchall()
        
        return {
            "total_generations": total_gens,
            "by_platform": [dict(r) for r in platform_rows],
            "by_brand": [dict(r) for r in brand_rows],
            "timeline": [dict(r) for r in timeline],
            "by_tone": [dict(r) for r in tone_rows]
        }
    finally:
        conn.close()

# ---------- TEMPLATES ----------
@app.get("/templates")
def get_templates():
    """Pre-built Indian marketing templates - no auth needed"""
    return TEMPLATES

TEMPLATES = [
    {
        "id": "diwali-sale",
        "name": "🪔 Diwali Sale Campaign",
        "category": "Festival",
        "description": "Festive sale post for the biggest Indian shopping season",
        "data": {"topic": "Diwali Sale - Up to 50% Off", "objective": "Drive Sales/Action", "target_audience": "Young Adults & Families", "platform": "Instagram", "tone": "Witty/Fun", "art_style": "Photorealistic", "indian_context": "Diwali celebrations, diyas, rangoli, family gatherings", "color_palette": "#FFD700, #FF6B35, #C41E3A, #1A1A2E", "text_structure": "Short Caption"}
    },
    {
        "id": "holi-greeting",
        "name": "🎨 Holi Greetings",
        "category": "Festival",
        "description": "Colorful Holi wishes for your brand",
        "data": {"topic": "Holi Festival Greetings", "objective": "Festive Greeting", "target_audience": "General", "platform": "Instagram", "tone": "Witty/Fun", "art_style": "Photorealistic", "indian_context": "Holi colors, gulal, water balloons, celebration", "color_palette": "#FF1493, #00BFFF, #FFD700, #32CD32, #FF4500", "text_structure": "Short Caption"}
    },
    {
        "id": "republic-day",
        "name": "🇮🇳 Republic Day",
        "category": "National",
        "description": "Patriotic post for January 26th",
        "data": {"topic": "Republic Day Tribute", "objective": "Brand Awareness", "target_audience": "General", "platform": "Instagram", "tone": "Emotional", "art_style": "Photorealistic", "indian_context": "Indian flag, Ashoka Chakra, unity in diversity", "color_palette": "#FF9933, #FFFFFF, #138808, #000080", "text_structure": "Short Caption"}
    },
    {
        "id": "independence-day",
        "name": "🇮🇳 Independence Day",
        "category": "National",
        "description": "Freedom celebration post for August 15th",
        "data": {"topic": "Independence Day Celebration", "objective": "Brand Awareness", "target_audience": "General", "platform": "Instagram", "tone": "Emotional", "art_style": "Photorealistic", "indian_context": "Tiranga, freedom fighters, India Gate", "color_palette": "#FF9933, #FFFFFF, #138808", "text_structure": "Short Caption"}
    },
    {
        "id": "ipl-season",
        "name": "🏏 IPL Season",
        "category": "Sports",
        "description": "Cricket fever content for IPL season",
        "data": {"topic": "IPL Season Special Offer", "objective": "Engagement", "target_audience": "Cricket Fans, Young Adults", "platform": "Instagram", "tone": "Bold/Loud", "art_style": "3D Render (Blender)", "indian_context": "IPL cricket, stadium, cricket bat and ball", "color_palette": "#1E3A5F, #FFD700, #FF4136", "text_structure": "Short Caption"}
    },
    {
        "id": "navratri",
        "name": "🔱 Navratri Campaign",
        "category": "Festival",
        "description": "Nine nights celebration with brand integration",
        "data": {"topic": "Navratri Special Collection", "objective": "Drive Sales/Action", "target_audience": "Women, Families", "platform": "Instagram", "tone": "Emotional", "art_style": "Photorealistic", "indian_context": "Garba dance, dandiya, colorful chaniya choli", "color_palette": "#FF6B35, #C41E3A, #FFD700, #2ECC71", "text_structure": "Short Caption"}
    },
    {
        "id": "product-launch",
        "name": "🚀 Product Launch",
        "category": "Business",
        "description": "New product announcement post",
        "data": {"topic": "New Product Launch", "objective": "Brand Awareness", "target_audience": "Tech-savvy Professionals", "platform": "LinkedIn", "tone": "Professional", "art_style": "3D Render (Blender)", "indian_context": "", "color_palette": "#667EEA, #764BA2, #F8F9FA", "text_structure": "Short Caption"}
    },
    {
        "id": "hiring-post",
        "name": "💼 Hiring / We're Recruiting",
        "category": "Business",
        "description": "Job posting for social media",
        "data": {"topic": "We Are Hiring - Join Our Team", "objective": "Engagement", "target_audience": "Job Seekers, Freshers, Professionals", "platform": "LinkedIn", "tone": "Professional", "art_style": "Flat Vector", "indian_context": "", "color_palette": "#0077B5, #00A0DC, #FFFFFF", "text_structure": "Short Caption"}
    },
    {
        "id": "makar-sankranti",
        "name": "🪁 Makar Sankranti",
        "category": "Festival",
        "description": "Kite festival greetings",
        "data": {"topic": "Makar Sankranti Wishes", "objective": "Festive Greeting", "target_audience": "General", "platform": "Instagram", "tone": "Witty/Fun", "art_style": "Flat Vector", "indian_context": "Kites, til-gul sweets, harvest festival", "color_palette": "#87CEEB, #FFD700, #FF6347, #32CD32", "text_structure": "Short Caption"}
    },
    {
        "id": "raksha-bandhan",
        "name": "🎀 Raksha Bandhan",
        "category": "Festival",
        "description": "Sibling bond celebration content",
        "data": {"topic": "Raksha Bandhan Gift Campaign", "objective": "Drive Sales/Action", "target_audience": "Siblings, Young Adults", "platform": "Instagram", "tone": "Emotional", "art_style": "Photorealistic", "indian_context": "Rakhi thread, sweets, brother-sister bond", "color_palette": "#E91E63, #FFD700, #FF5722", "text_structure": "Short Caption"}
    },
    {
        "id": "eid-mubarak",
        "name": "🌙 Eid Mubarak",
        "category": "Festival",
        "description": "Eid celebration greetings",
        "data": {"topic": "Eid Mubarak Wishes", "objective": "Festive Greeting", "target_audience": "General", "platform": "Instagram", "tone": "Emotional", "art_style": "Photorealistic", "indian_context": "Crescent moon, mosque, biryani, celebration", "color_palette": "#1A5276, #F4D03F, #FFFFFF, #2ECC71", "text_structure": "Short Caption"}
    },
    {
        "id": "startup-announcement",
        "name": "💡 Startup Announcement",
        "category": "Business",
        "description": "Startup milestone or funding announcement",
        "data": {"topic": "Startup Milestone Announcement", "objective": "Brand Awareness", "target_audience": "Investors, Tech Community", "platform": "LinkedIn", "tone": "Professional", "art_style": "Minimalist Line Art", "indian_context": "Indian startup ecosystem", "color_palette": "#6C63FF, #FF6584, #F8F9FA", "text_structure": "Short Caption"}
    },
    {
        "id": "food-delivery",
        "name": "🍕 Food Delivery Promo",
        "category": "Food",
        "description": "Food delivery app promotional content",
        "data": {"topic": "Midnight Cravings Discount", "objective": "Drive Sales/Action", "target_audience": "Foodies, College Students", "platform": "Instagram", "tone": "Witty/Fun", "art_style": "Photorealistic", "indian_context": "Street food, chai, biryani, samosa", "color_palette": "#FF5722, #FFC107, #4CAF50", "text_structure": "Short Caption"}
    },
    {
        "id": "teachers-day",
        "name": "📚 Teachers' Day",
        "category": "National",
        "description": "Teachers' Day tribute post",
        "data": {"topic": "Teachers Day Tribute", "objective": "Festive Greeting", "target_audience": "Students, Education Community", "platform": "Instagram", "tone": "Emotional", "art_style": "Flat Vector", "indian_context": "Dr. Radhakrishnan, chalk and board, guru-shishya", "color_palette": "#2196F3, #FFC107, #FFFFFF", "text_structure": "Short Caption"}
    },
    {
        "id": "year-end-sale",
        "name": "🎉 Year End Sale",
        "category": "Business",
        "description": "End of year clearance sale",
        "data": {"topic": "Year End Mega Sale - Last Chance!", "objective": "Drive Sales/Action", "target_audience": "Shoppers, Deal Hunters", "platform": "Instagram", "tone": "Bold/Loud", "art_style": "Cyberpunk/Neon", "indian_context": "New Year celebrations", "color_palette": "#FF0000, #FFD700, #000000, #FFFFFF", "text_structure": "Short Caption"}
    }
]

# ---------- INDIAN CALENDAR ----------
@app.get("/indian-calendar")
def get_indian_calendar():
    """Returns upcoming Indian festivals and events"""
    events = [
        {"date": "2026-01-14", "name": "Makar Sankranti / Pongal", "emoji": "🪁", "category": "Festival"},
        {"date": "2026-01-26", "name": "Republic Day", "emoji": "🇮🇳", "category": "National"},
        {"date": "2026-03-14", "name": "Holi", "emoji": "🎨", "category": "Festival"},
        {"date": "2026-03-30", "name": "Eid ul-Fitr", "emoji": "🌙", "category": "Festival"},
        {"date": "2026-04-02", "name": "Ram Navami", "emoji": "🏹", "category": "Festival"},
        {"date": "2026-04-14", "name": "Baisakhi / Tamil New Year", "emoji": "🌾", "category": "Festival"},
        {"date": "2026-05-01", "name": "May Day / Labour Day", "emoji": "✊", "category": "National"},
        {"date": "2026-05-07", "name": "Buddha Purnima", "emoji": "🪷", "category": "Festival"},
        {"date": "2026-06-05", "name": "Eid ul-Adha", "emoji": "🌙", "category": "Festival"},
        {"date": "2026-06-21", "name": "International Yoga Day", "emoji": "🧘", "category": "National"},
        {"date": "2026-07-06", "name": "Muharram", "emoji": "🌙", "category": "Festival"},
        {"date": "2026-08-12", "name": "Raksha Bandhan", "emoji": "🎀", "category": "Festival"},
        {"date": "2026-08-15", "name": "Independence Day", "emoji": "🇮🇳", "category": "National"},
        {"date": "2026-08-19", "name": "Janmashtami", "emoji": "🦚", "category": "Festival"},
        {"date": "2026-09-05", "name": "Teachers' Day", "emoji": "📚", "category": "National"},
        {"date": "2026-09-14", "name": "Hindi Diwas", "emoji": "📝", "category": "National"},
        {"date": "2026-09-25", "name": "Milad un-Nabi", "emoji": "🌙", "category": "Festival"},
        {"date": "2026-10-02", "name": "Gandhi Jayanti", "emoji": "🕊️", "category": "National"},
        {"date": "2026-10-02", "name": "Navratri Begins", "emoji": "🔱", "category": "Festival"},
        {"date": "2026-10-11", "name": "Dussehra / Vijayadashami", "emoji": "🏹", "category": "Festival"},
        {"date": "2026-10-20", "name": "Karwa Chauth", "emoji": "🌙", "category": "Festival"},
        {"date": "2026-10-31", "name": "Halloween (Trending)", "emoji": "🎃", "category": "Trending"},
        {"date": "2026-11-01", "name": "Diwali", "emoji": "🪔", "category": "Festival"},
        {"date": "2026-11-02", "name": "Govardhan Puja", "emoji": "🏔️", "category": "Festival"},
        {"date": "2026-11-03", "name": "Bhai Dooj", "emoji": "👫", "category": "Festival"},
        {"date": "2026-11-15", "name": "Guru Nanak Jayanti", "emoji": "🙏", "category": "Festival"},
        {"date": "2026-11-27", "name": "Black Friday (Trending)", "emoji": "🛒", "category": "Trending"},
        {"date": "2026-12-25", "name": "Christmas", "emoji": "🎄", "category": "Festival"},
        {"date": "2026-12-31", "name": "New Year's Eve", "emoji": "🎉", "category": "Trending"},
        {"date": "2027-01-14", "name": "Makar Sankranti / Pongal", "emoji": "🪁", "category": "Festival"},
        {"date": "2027-01-26", "name": "Republic Day", "emoji": "🇮🇳", "category": "National"},
        {"date": "2027-02-14", "name": "Valentine's Day (Trending)", "emoji": "❤️", "category": "Trending"},
    ]
    return events

# ---------- HASHTAG GENERATOR ----------
@app.get("/hashtags")
def generate_hashtags(brand: str = "", topic: str = "", platform: str = "Instagram", industry: str = ""):
    """Rule-based hashtag generator - no AI needed"""
    hashtags = set()
    
    # Brand hashtags
    if brand:
        clean_brand = brand.replace(" ", "")
        hashtags.add(f"#{clean_brand}")
        hashtags.add(f"#{clean_brand}India")
    
    # Topic-based
    topic_lower = topic.lower() if topic else ""
    
    festival_tags = {
        "diwali": ["#HappyDiwali", "#DiwaliVibes", "#FestivalOfLights", "#DiwaliSale", "#DiwaliCelebration", "#DiwaliOffer"],
        "holi": ["#HappyHoli", "#HoliHai", "#FestivalOfColors", "#HoliCelebration", "#ColorfulHoli"],
        "christmas": ["#MerryChristmas", "#ChristmasVibes", "#Christmas2026", "#FestiveSeason", "#XmasSale"],
        "eid": ["#EidMubarak", "#EidUlFitr", "#EidCelebration", "#EidVibes", "#Ramadan"],
        "republic": ["#RepublicDay", "#26January", "#IndianRepublicDay", "#JaiHind", "#ProudIndian"],
        "independence": ["#IndependenceDay", "#15August", "#JaiHind", "#FreedomDay", "#IndianIndependence"],
        "raksha": ["#RakshaBandhan", "#Rakhi", "#BrotherSister", "#RakhiGifts", "#SiblingLove"],
        "navratri": ["#Navratri", "#GarbaNight", "#NavratriVibes", "#DandiyaRaas", "#NavratriFashion"],
        "ganesh": ["#GaneshChaturthi", "#GanapatiDecoration", "#EcoFriendlyGanesh", "#GanpatiBappaMorya"],
        "ipl": ["#IPL", "#IPL2026", "#CricketFever", "#IPLSeason", "#Cricket"],
        "hiring": ["#WeAreHiring", "#JobOpening", "#Careers", "#JoinOurTeam", "#Hiring", "#JobAlert"],
        "launch": ["#NewLaunch", "#ProductLaunch", "#ComingSoon", "#Launched", "#NewProduct"],
        "sale": ["#Sale", "#BigSale", "#MegaSale", "#Discount", "#Offer", "#DealOfTheDay"],
        "startup": ["#StartupIndia", "#IndianStartup", "#Entrepreneurship", "#StartupLife", "#Innovation"],
    }
    
    for keyword, tags in festival_tags.items():
        if keyword in topic_lower:
            hashtags.update(tags)
    
    # Platform-specific
    platform_tags = {
        "Instagram": ["#InstaDaily", "#InstaMood", "#ReelsIndia", "#Trending", "#Viral"],
        "LinkedIn": ["#Leadership", "#Innovation", "#WorkCulture", "#ProfessionalGrowth", "#Industry"],
        "Twitter": ["#Trending", "#Thread", "#Viral", "#India"],
        "YouTube": ["#YouTubeIndia", "#Subscribe", "#Trending", "#Viral"],
    }
    if platform in platform_tags:
        hashtags.update(platform_tags[platform][:3])
    
    # Industry tags
    industry_lower = industry.lower() if industry else ""
    industry_tags = {
        "tech": ["#TechIndia", "#DigitalIndia", "#TechStartup", "#Innovation"],
        "food": ["#FoodieIndia", "#IndianFood", "#Foodie", "#FoodLovers"],
        "fashion": ["#FashionIndia", "#IndianFashion", "#StyleIndia", "#OOTD"],
        "education": ["#EdTech", "#LearnOnline", "#Education", "#SkillDevelopment"],
        "health": ["#HealthyIndia", "#FitIndia", "#Wellness", "#Healthcare"],
        "finance": ["#FinanceIndia", "#Investment", "#FinTech", "#MoneyMatters"],
    }
    for ind_key, tags in industry_tags.items():
        if ind_key in industry_lower:
            hashtags.update(tags)
    
    # Always include
    hashtags.update(["#India", "#MakeInIndia", "#ContentCreator", "#SocialMediaMarketing"])
    
    return {"hashtags": sorted(list(hashtags))[:20]}

# ---------- CAMPAIGNS ----------
class CampaignCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    brand_name: Optional[str] = ""
    start_date: Optional[str] = ""
    end_date: Optional[str] = ""
    template_type: Optional[str] = "custom"
    posts_data: Optional[str] = "[]"

CAMPAIGN_FRAMEWORKS = {
    "product_launch": {
        "name": "Product Launch", "posts": [
            {"day": 1, "type": "Teaser", "prompt_hint": "mysterious hint, coming soon"},
            {"day": 3, "type": "Sneak Peek", "prompt_hint": "behind the scenes, preview"},
            {"day": 5, "type": "Launch Day", "prompt_hint": "grand reveal, celebration"},
            {"day": 6, "type": "Features Deep-Dive", "prompt_hint": "product features, benefits"},
            {"day": 7, "type": "Customer Testimonial", "prompt_hint": "social proof, reviews"},
        ]
    },
    "festival_week": {
        "name": "Festival Week", "posts": [
            {"day": -3, "type": "Countdown", "prompt_hint": "3 days to go, anticipation"},
            {"day": -1, "type": "Eve Special", "prompt_hint": "last minute deals, excitement"},
            {"day": 0, "type": "Festival Day", "prompt_hint": "greetings, celebration, warmth"},
            {"day": 1, "type": "Thank You", "prompt_hint": "gratitude, recap, highlights"},
            {"day": 3, "type": "Extended Sale", "prompt_hint": "final chance, extended offers"},
        ]
    },
    "hiring_drive": {
        "name": "Hiring Drive", "posts": [
            {"day": 1, "type": "Culture Showcase", "prompt_hint": "team culture, fun workplace"},
            {"day": 2, "type": "Role Announcement", "prompt_hint": "job description, opportunities"},
            {"day": 4, "type": "Employee Story", "prompt_hint": "day in the life, growth story"},
            {"day": 6, "type": "Benefits Highlight", "prompt_hint": "perks, growth, learning"},
            {"day": 7, "type": "Last Call", "prompt_hint": "deadline, apply now, urgency"},
        ]
    },
    "brand_awareness": {
        "name": "Brand Awareness", "posts": [
            {"day": 1, "type": "Brand Story", "prompt_hint": "origin story, mission"},
            {"day": 3, "type": "Problem We Solve", "prompt_hint": "customer pain points, solutions"},
            {"day": 5, "type": "Behind the Scenes", "prompt_hint": "office, team, process"},
            {"day": 7, "type": "Community Impact", "prompt_hint": "social impact, giving back"},
            {"day": 9, "type": "Customer Spotlight", "prompt_hint": "testimonials, success stories"},
        ]
    },
}

@app.get("/campaign-frameworks")
def get_campaign_frameworks():
    return CAMPAIGN_FRAMEWORKS

@app.get("/campaigns")
def list_campaigns(user=Depends(get_current_user)):
    conn = get_db()
    try:
        rows = conn.execute("SELECT * FROM campaigns WHERE user_id = ? ORDER BY created_at DESC", (user["user_id"],)).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()

@app.post("/campaigns")
def create_campaign(campaign: CampaignCreate, user=Depends(get_current_user)):
    conn = get_db()
    try:
        cid = str(uuid.uuid4())
        conn.execute(
            "INSERT INTO campaigns (id, user_id, name, description, brand_name, start_date, end_date, template_type, posts_data) VALUES (?,?,?,?,?,?,?,?,?)",
            (cid, user["user_id"], campaign.name, campaign.description, campaign.brand_name, campaign.start_date, campaign.end_date, campaign.template_type, campaign.posts_data)
        )
        conn.commit()
        award_xp(conn, user["user_id"], 50, "campaign_created")
        return {"id": cid, "message": "Campaign created"}
    finally:
        conn.close()

@app.put("/campaigns/{cid}")
def update_campaign(cid: str, campaign: CampaignCreate, user=Depends(get_current_user)):
    conn = get_db()
    try:
        conn.execute(
            "UPDATE campaigns SET name=?, description=?, brand_name=?, start_date=?, end_date=?, template_type=?, posts_data=?, status='active' WHERE id=? AND user_id=?",
            (campaign.name, campaign.description, campaign.brand_name, campaign.start_date, campaign.end_date, campaign.template_type, campaign.posts_data, cid, user["user_id"])
        )
        conn.commit()
        return {"message": "Campaign updated"}
    finally:
        conn.close()

@app.delete("/campaigns/{cid}")
def delete_campaign(cid: str, user=Depends(get_current_user)):
    conn = get_db()
    try:
        conn.execute("DELETE FROM campaigns WHERE id=? AND user_id=?", (cid, user["user_id"]))
        conn.commit()
        return {"message": "Campaign deleted"}
    finally:
        conn.close()

# ---------- CONTENT SCHEDULING ----------
class SchedulePost(BaseModel):
    generation_id: str
    scheduled_date: str

@app.post("/schedule")
def schedule_post(req: SchedulePost, user=Depends(get_current_user)):
    conn = get_db()
    try:
        conn.execute("UPDATE generations SET scheduled_date=?, status='scheduled' WHERE id=? AND user_id=?",
                      (req.scheduled_date, req.generation_id, user["user_id"]))
        conn.commit()
        return {"message": "Post scheduled"}
    finally:
        conn.close()

@app.get("/scheduled")
def get_scheduled(user=Depends(get_current_user)):
    conn = get_db()
    try:
        rows = conn.execute(
            "SELECT * FROM generations WHERE user_id=? AND scheduled_date != '' ORDER BY scheduled_date ASC",
            (user["user_id"],)
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()

@app.delete("/schedule/{gen_id}")
def unschedule_post(gen_id: str, user=Depends(get_current_user)):
    conn = get_db()
    try:
        conn.execute("UPDATE generations SET scheduled_date='', status='published' WHERE id=? AND user_id=?",
                      (gen_id, user["user_id"]))
        conn.commit()
        return {"message": "Unscheduled"}
    finally:
        conn.close()

# ---------- EVERGREEN CONTENT QUEUE ----------
@app.post("/evergreen/{gen_id}")
def mark_evergreen(gen_id: str, recycle_days: int = 30, user=Depends(get_current_user)):
    conn = get_db()
    try:
        conn.execute("UPDATE generations SET is_evergreen=1, recycle_days=? WHERE id=? AND user_id=?",
                      (recycle_days, gen_id, user["user_id"]))
        conn.commit()
        return {"message": "Marked as evergreen"}
    finally:
        conn.close()

@app.delete("/evergreen/{gen_id}")
def remove_evergreen(gen_id: str, user=Depends(get_current_user)):
    conn = get_db()
    try:
        conn.execute("UPDATE generations SET is_evergreen=0, recycle_days=0 WHERE id=? AND user_id=?",
                      (gen_id, user["user_id"]))
        conn.commit()
        return {"message": "Removed from evergreen"}
    finally:
        conn.close()

@app.get("/evergreen")
def get_evergreen_queue(user=Depends(get_current_user)):
    conn = get_db()
    try:
        rows = conn.execute(
            "SELECT * FROM generations WHERE user_id=? AND is_evergreen=1 ORDER BY created_at DESC",
            (user["user_id"],)
        ).fetchall()
        items = []
        for r in rows:
            d = dict(r)
            created = datetime.fromisoformat(d["created_at"]) if d["created_at"] else datetime.utcnow()
            recycle = d.get("recycle_days", 30) or 30
            next_date = created + timedelta(days=recycle)
            while next_date < datetime.utcnow():
                next_date += timedelta(days=recycle)
            d["next_recycle"] = next_date.isoformat()
            d["days_until_recycle"] = (next_date - datetime.utcnow()).days
            items.append(d)
        return items
    finally:
        conn.close()

# ---------- CONTENT SCORING (Zero AI) ----------
@app.post("/analyze/engagement")
def predict_engagement(data: dict):
    """Rule-based engagement prediction (0 AI calls)"""
    text = data.get("text", "")
    platform = data.get("platform", "Instagram")
    
    score = 50  # Base score
    factors = []
    
    # Length optimization
    char_limits = {"Instagram": (100, 2200), "Twitter": (50, 280), "LinkedIn": (150, 3000), "YouTube": (200, 5000)}
    min_len, max_len = char_limits.get(platform, (100, 2200))
    text_len = len(text)
    if min_len <= text_len <= max_len:
        score += 10
        factors.append({"name": "Optimal Length", "impact": "+10", "type": "positive"})
    elif text_len > max_len:
        score -= 15
        factors.append({"name": "Too Long", "impact": "-15", "type": "negative"})
    elif text_len < min_len:
        score -= 5
        factors.append({"name": "Too Short", "impact": "-5", "type": "negative"})
    
    # Emoji boost
    import re
    emoji_pattern = re.compile("[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF\U0001F1E0-\U0001F1FF\U00002702-\U000027B0\U0000FE00-\U0000FE0F\U0001F900-\U0001F9FF\U0001FA00-\U0001FA6F\U0001FA70-\U0001FAFF]", re.UNICODE)
    emoji_count = len(emoji_pattern.findall(text))
    if 1 <= emoji_count <= 5:
        score += 8
        factors.append({"name": "Good Emoji Usage", "impact": "+8", "type": "positive"})
    elif emoji_count > 8:
        score -= 5
        factors.append({"name": "Too Many Emojis", "impact": "-5", "type": "negative"})
    
    # CTA detection
    cta_words = ["shop now", "buy", "link in bio", "swipe", "click", "tap", "dm", "comment", "share", "tag", "follow", "subscribe", "order", "grab", "book", "register"]
    if any(w in text.lower() for w in cta_words):
        score += 12
        factors.append({"name": "Call-to-Action", "impact": "+12", "type": "positive"})
    
    # Question engagement
    if "?" in text:
        score += 8
        factors.append({"name": "Question (Drives Comments)", "impact": "+8", "type": "positive"})
    
    # Hashtag count
    hashtag_count = text.count("#")
    if 3 <= hashtag_count <= 10:
        score += 6
        factors.append({"name": "Good Hashtag Count", "impact": "+6", "type": "positive"})
    elif hashtag_count > 15:
        score -= 8
        factors.append({"name": "Hashtag Spam", "impact": "-8", "type": "negative"})
    
    # Line breaks / readability
    if "\n" in text:
        score += 5
        factors.append({"name": "Line Breaks (Readable)", "impact": "+5", "type": "positive"})
    
    # Urgency words
    urgency = ["limited", "hurry", "last chance", "only", "exclusive", "today", "now", "ending", "flash"]
    if any(w in text.lower() for w in urgency):
        score += 7
        factors.append({"name": "Urgency/FOMO", "impact": "+7", "type": "positive"})
    
    # Numbers boost
    if re.search(r'\d+%|\d+x|\d+ off|₹\d+', text):
        score += 6
        factors.append({"name": "Numbers/Stats", "impact": "+6", "type": "positive"})
    
    score = max(5, min(100, score))
    
    grade = "A+" if score >= 90 else "A" if score >= 80 else "B+" if score >= 70 else "B" if score >= 60 else "C" if score >= 50 else "D"
    
    return {"score": score, "grade": grade, "factors": factors, "platform": platform}

@app.post("/analyze/readability")
def analyze_readability(data: dict):
    """Flesch-Kincaid readability analysis (0 AI calls)"""
    import re
    text = data.get("text", "")
    if not text.strip():
        return {"score": 0, "grade": "N/A", "metrics": {}}
    
    sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]
    words = text.split()
    
    num_sentences = max(len(sentences), 1)
    num_words = max(len(words), 1)
    
    # Count syllables (simplified)
    def count_syllables(word):
        word = word.lower().strip(".,!?;:'\"")
        if len(word) <= 3:
            return 1
        count = 0
        vowels = "aeiou"
        prev_vowel = False
        for char in word:
            is_vowel = char in vowels
            if is_vowel and not prev_vowel:
                count += 1
            prev_vowel = is_vowel
        if word.endswith("e"):
            count -= 1
        return max(count, 1)
    
    total_syllables = sum(count_syllables(w) for w in words)
    
    # Flesch Reading Ease
    flesch = 206.835 - 1.015 * (num_words / num_sentences) - 84.6 * (total_syllables / num_words)
    flesch = max(0, min(100, flesch))
    
    # Flesch-Kincaid Grade Level
    fk_grade = 0.39 * (num_words / num_sentences) + 11.8 * (total_syllables / num_words) - 15.59
    fk_grade = max(1, min(18, fk_grade))
    
    # Passive voice detection (simplified)
    passive_words = ["was", "were", "been", "being", "is", "are", "am"]
    passive_count = sum(1 for w in words if w.lower() in passive_words)
    passive_pct = round((passive_count / num_words) * 100, 1)
    
    # Complex words (3+ syllables)
    complex_words = [w for w in words if count_syllables(w) >= 3]
    
    if flesch >= 80:
        grade = "Very Easy"
    elif flesch >= 60:
        grade = "Easy"
    elif flesch >= 40:
        grade = "Moderate"
    elif flesch >= 20:
        grade = "Difficult"
    else:
        grade = "Very Difficult"
    
    return {
        "flesch_score": round(flesch, 1),
        "grade": grade,
        "fk_grade_level": round(fk_grade, 1),
        "metrics": {
            "sentences": num_sentences,
            "words": num_words,
            "syllables": total_syllables,
            "avg_sentence_length": round(num_words / num_sentences, 1),
            "avg_syllables_per_word": round(total_syllables / num_words, 2),
            "passive_voice_pct": passive_pct,
            "complex_words": len(complex_words),
            "reading_time_seconds": round(num_words / 4.2)  # avg reading speed
        }
    }

@app.post("/analyze/tone")
def analyze_tone(data: dict):
    """Keyword-based tone detection (0 AI calls) — returns radar chart data"""
    text = data.get("text", "").lower()
    words = text.split()
    word_count = max(len(words), 1)
    
    tone_keywords = {
        "Professional": ["leverage", "optimize", "strategy", "solution", "innovative", "excellence", "partnership", "milestone", "growth", "industry", "enterprise", "workflow", "productivity", "expertise", "stakeholder"],
        "Casual": ["hey", "yo", "btw", "lol", "omg", "vibes", "chill", "fam", "bro", "squad", "lit", "dope", "cool", "awesome", "hangout"],
        "Urgent": ["hurry", "limited", "now", "today", "rush", "deadline", "last", "final", "emergency", "asap", "quick", "fast", "immediate", "closing", "ending"],
        "Emotional": ["love", "heart", "dream", "inspire", "believe", "hope", "grateful", "blessed", "journey", "together", "forever", "cherish", "passion", "soul", "beautiful"],
        "Humorous": ["haha", "joke", "lol", "funny", "meme", "comedy", "laugh", "pun", "quirky", "twist", "sarcasm", "wit", "hilarious", "rofl"],
        "Informative": ["study", "research", "fact", "data", "statistic", "according", "report", "learn", "guide", "tips", "how to", "tutorial", "explained", "insight"],
    }
    
    scores = {}
    for tone, keywords in tone_keywords.items():
        matches = sum(1 for w in words if w.strip(".,!?;:'\"") in keywords)
        # Also check for 2-word phrases
        text_lower = text
        phrase_matches = sum(1 for kw in keywords if " " in kw and kw in text_lower)
        total_matches = matches + phrase_matches
        scores[tone] = min(round((total_matches / word_count) * 100 * 5, 1), 100)
    
    # Determine dominant tone
    dominant = max(scores, key=scores.get) if any(v > 0 for v in scores.values()) else "Neutral"
    
    return {"scores": scores, "dominant_tone": dominant, "word_count": word_count}

@app.post("/analyze/brand-consistency")
def analyze_brand_consistency(data: dict, user=Depends(get_current_user)):
    """Score how well content matches brand profile (0 AI calls)"""
    text = data.get("text", "").lower()
    brand_id = data.get("brand_id", "")
    
    conn = get_db()
    try:
        brand = conn.execute("SELECT * FROM brands WHERE id=? AND user_id=?", (brand_id, user["user_id"])).fetchone()
        if not brand:
            return {"score": 0, "factors": [], "message": "Brand not found"}
        
        brand = dict(brand)
        score = 50  # Base score
        factors = []
        
        # Tone match
        tone = brand.get("default_tone", "").lower()
        tone_keywords_map = {
            "modern": ["innovative", "fresh", "new", "latest", "trending"],
            "professional": ["excellence", "quality", "trusted", "expert", "solution"],
            "witty/fun": ["fun", "enjoy", "laugh", "quirky", "exciting"],
            "emotional": ["love", "heart", "dream", "inspire", "grateful"],
            "bold/loud": ["bold", "power", "ultimate", "massive", "epic"],
            "minimalist": ["simple", "clean", "pure", "essential", "less"],
        }
        if tone in tone_keywords_map:
            matches = sum(1 for w in tone_keywords_map[tone] if w in text)
            if matches >= 2:
                score += 20
                factors.append({"name": f"Tone Match ({brand.get('default_tone','')})", "impact": "+20", "type": "positive"})
            elif matches >= 1:
                score += 10
                factors.append({"name": f"Partial Tone Match", "impact": "+10", "type": "positive"})
            else:
                score -= 10
                factors.append({"name": "Tone Mismatch", "impact": "-10", "type": "negative"})
        
        # Brand voice keywords
        voice_kw = brand.get("brand_voice_keywords", "")
        if voice_kw:
            kw_list = [k.strip().lower() for k in voice_kw.split(",") if k.strip()]
            matches = sum(1 for kw in kw_list if kw in text)
            if matches > 0:
                bonus = min(matches * 8, 25)
                score += bonus
                factors.append({"name": f"Voice Keywords ({matches} found)", "impact": f"+{bonus}", "type": "positive"})
        
        # Audience match
        audience = brand.get("default_audience", "").lower()
        if audience and audience in text:
            score += 10
            factors.append({"name": "Target Audience Mentioned", "impact": "+10", "type": "positive"})
        
        # Brand name presence
        brand_name = brand.get("name", "").lower()
        if brand_name and brand_name in text:
            score += 10
            factors.append({"name": "Brand Name Present", "impact": "+10", "type": "positive"})
        
        score = max(5, min(100, score))
        grade = "A+" if score >= 90 else "A" if score >= 80 else "B+" if score >= 70 else "B" if score >= 60 else "C" if score >= 50 else "D"
        
        return {"score": score, "grade": grade, "factors": factors, "brand_name": brand.get("name", "")}
    finally:
        conn.close()

# ---------- CONTENT REPURPOSER (Zero AI) ----------
@app.post("/repurpose")
def repurpose_content(data: dict):
    """Rule-based content adaptation for different platforms (0 AI calls)"""
    text = data.get("text", "")
    source_platform = data.get("source_platform", "Instagram")
    brand_name = data.get("brand_name", "")
    
    results = {}
    
    # Instagram version
    insta = text[:2200]
    if len(text) > 2200:
        insta = text[:2190] + "..."
    results["Instagram"] = {"text": insta, "char_limit": 2200, "tip": "Add 5-10 relevant hashtags below the caption"}
    
    # Twitter/X version
    sentences = [s.strip() for s in text.split(".") if s.strip()]
    if len(text) <= 280:
        twitter = text
    else:
        twitter = sentences[0][:250] + "..." if sentences else text[:277] + "..."
    results["Twitter"] = {"text": twitter, "char_limit": 280, "tip": "Make it punchy! Start with a hook."}
    
    # Twitter Thread
    if len(text) > 280:
        thread = []
        thread.append(f"🧵 Thread: {sentences[0][:250]}")
        for i, s in enumerate(sentences[1:], 2):
            if len(thread) >= 8:
                break
            thread.append(f"{i}/ {s.strip()}")
        thread.append(f"{'—' * 3}\nLike & RT if this was helpful! Follow @{brand_name.replace(' ', '')} for more.")
        results["Twitter Thread"] = {"text": "\n\n".join(thread), "char_limit": None, "tip": "Post each paragraph as a separate tweet"}
    
    # LinkedIn version
    lines = text.split("\n")
    linkedin_lines = []
    linkedin_lines.append(f"💡 {sentences[0]}" if sentences else text[:200])
    linkedin_lines.append("")
    for line in lines[1:] if len(lines) > 1 else sentences[1:4]:
        linkedin_lines.append(f"→ {line.strip()}" if line.strip() else "")
    linkedin_lines.append("")
    linkedin_lines.append(f"What are your thoughts? Drop a comment below! 👇")
    linkedin_lines.append("")
    linkedin_lines.append(f"#ContentMarketing #BrandStrategy #IndianBusiness")
    results["LinkedIn"] = {"text": "\n".join(linkedin_lines)[:3000], "char_limit": 3000, "tip": "LinkedIn favors thought-leadership style content"}
    
    # WhatsApp Broadcast
    whatsapp = f"*{brand_name}*\n\n{text[:1000]}\n\n📲 Share with friends!"
    results["WhatsApp"] = {"text": whatsapp, "char_limit": 65536, "tip": "Use *bold* and _italic_ formatting"}
    
    # Email Subject + Preview
    subject = f"{sentences[0][:60]}" if sentences else text[:60]
    preview = sentences[1][:90] if len(sentences) > 1 else ""
    email_body = f"Hi there,\n\n{text}\n\nBest regards,\n{brand_name}"
    results["Email"] = {"subject": subject, "preview": preview, "text": email_body, "char_limit": None, "tip": "Keep subject under 60 chars for mobile"}
    
    return results

# ---------- APPROVAL WORKFLOW ----------
class ApprovalSubmit(BaseModel):
    generation_id: str
    
class ApprovalReview(BaseModel):
    status: str  # 'approved', 'rejected', 'revision_needed'
    reviewer_notes: Optional[str] = ""

@app.post("/approvals/submit")
def submit_for_approval(req: ApprovalSubmit, user=Depends(get_current_user)):
    conn = get_db()
    try:
        aid = str(uuid.uuid4())
        conn.execute(
            "INSERT INTO approvals (id, generation_id, user_id, status, submitted_at) VALUES (?,?,?,?,?)",
            (aid, req.generation_id, user["user_id"], "pending", datetime.utcnow().isoformat())
        )
        conn.execute("UPDATE generations SET status='in_review' WHERE id=? AND user_id=?",
                      (req.generation_id, user["user_id"]))
        conn.commit()
        return {"id": aid, "message": "Submitted for review"}
    finally:
        conn.close()

@app.put("/approvals/{approval_id}")
def review_approval(approval_id: str, review: ApprovalReview, user=Depends(get_current_user)):
    conn = get_db()
    try:
        conn.execute(
            "UPDATE approvals SET status=?, reviewer_notes=?, reviewed_at=? WHERE id=? AND user_id=?",
            (review.status, review.reviewer_notes, datetime.utcnow().isoformat(), approval_id, user["user_id"])
        )
        # Update generation status too
        approval = conn.execute("SELECT generation_id FROM approvals WHERE id=?", (approval_id,)).fetchone()
        if approval:
            new_status = "approved" if review.status == "approved" else "draft" if review.status == "rejected" else "revision_needed"
            conn.execute("UPDATE generations SET status=? WHERE id=?", (new_status, approval["generation_id"]))
        conn.commit()
        return {"message": f"Content {review.status}"}
    finally:
        conn.close()

@app.get("/approvals")
def list_approvals(user=Depends(get_current_user)):
    conn = get_db()
    try:
        rows = conn.execute("""
            SELECT a.*, g.script, g.brand_name, g.platform, g.image_url 
            FROM approvals a JOIN generations g ON a.generation_id = g.id 
            WHERE a.user_id=? ORDER BY a.created_at DESC
        """, (user["user_id"],)).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()

# ---------- GAMIFICATION ----------
BADGE_DEFINITIONS = [
    {"id": "first_gen", "name": "First Creation", "emoji": "🌟", "description": "Generated your first content", "xp_threshold": 0, "condition": "generations >= 1"},
    {"id": "power_10", "name": "Power Creator", "emoji": "⚡", "description": "Generated 10 pieces of content", "xp_threshold": 0, "condition": "generations >= 10"},
    {"id": "streak_7", "name": "Week Warrior", "emoji": "🔥", "description": "7-day creation streak", "xp_threshold": 0, "condition": "streak >= 7"},
    {"id": "streak_30", "name": "Month Master", "emoji": "💎", "description": "30-day creation streak", "xp_threshold": 0, "condition": "streak >= 30"},
    {"id": "brand_3", "name": "Brand Builder", "emoji": "🏗️", "description": "Created 3 brand profiles", "xp_threshold": 0, "condition": "brands >= 3"},
    {"id": "campaign_1", "name": "Campaign Commander", "emoji": "🎯", "description": "Created your first campaign", "xp_threshold": 0, "condition": "campaigns >= 1"},
    {"id": "all_platforms", "name": "Omnichannel Pro", "emoji": "🌐", "description": "Generated for 5+ platforms", "xp_threshold": 0, "condition": "platforms >= 5"},
    {"id": "template_user", "name": "Template Master", "emoji": "📋", "description": "Used 5+ different templates", "xp_threshold": 0, "condition": "templates >= 5"},
    {"id": "xp_500", "name": "Rising Star", "emoji": "⭐", "description": "Earned 500 XP", "xp_threshold": 500},
    {"id": "xp_2000", "name": "Content Legend", "emoji": "🏆", "description": "Earned 2000 XP", "xp_threshold": 2000},
]

def award_xp(conn, user_id: str, xp_amount: int, action: str):
    """Award XP and update streak"""
    today = datetime.utcnow().strftime("%Y-%m-%d")
    user = conn.execute("SELECT xp, streak_current, streak_best, streak_last_date FROM users WHERE id=?", (user_id,)).fetchone()
    if not user:
        return
    
    current_xp = (user["xp"] or 0) + xp_amount
    streak = user["streak_current"] or 0
    best_streak = user["streak_best"] or 0
    last_date = user["streak_last_date"] or ""
    
    # Update streak
    if last_date == today:
        pass  # Already counted today
    elif last_date == (datetime.utcnow() - timedelta(days=1)).strftime("%Y-%m-%d"):
        streak += 1  # Consecutive day
    else:
        streak = 1  # Reset
    
    if streak > best_streak:
        best_streak = streak
    
    # Calculate level (100 XP per level)
    level = max(1, current_xp // 100 + 1)
    
    conn.execute(
        "UPDATE users SET xp=?, level=?, streak_current=?, streak_best=?, streak_last_date=? WHERE id=?",
        (current_xp, level, streak, best_streak, today, user_id)
    )
    conn.commit()

def check_badges(conn, user_id: str):
    """Check and award new badges"""
    user = conn.execute("SELECT xp, badges FROM users WHERE id=?", (user_id,)).fetchone()
    if not user:
        return []
    
    current_badges = json.loads(user["badges"] or "[]")
    current_badge_ids = {b["id"] for b in current_badges} if isinstance(current_badges, list) and current_badges and isinstance(current_badges[0], dict) else set(current_badges)
    
    # Get stats
    gen_count = conn.execute("SELECT COUNT(*) FROM generations WHERE user_id=?", (user_id,)).fetchone()[0]
    brand_count = conn.execute("SELECT COUNT(*) FROM brands WHERE user_id=?", (user_id,)).fetchone()[0]
    campaign_count = conn.execute("SELECT COUNT(*) FROM campaigns WHERE user_id=?", (user_id,)).fetchone()[0]
    platform_count = conn.execute("SELECT COUNT(DISTINCT platform) FROM generations WHERE user_id=?", (user_id,)).fetchone()[0]
    streak = user["xp"] and conn.execute("SELECT streak_current FROM users WHERE id=?", (user_id,)).fetchone()["streak_current"] or 0
    
    new_badges = []
    for badge in BADGE_DEFINITIONS:
        if badge["id"] in current_badge_ids:
            continue
        
        earned = False
        if badge.get("xp_threshold", 0) > 0:
            earned = (user["xp"] or 0) >= badge["xp_threshold"]
        elif "generations >= " in badge.get("condition", ""):
            threshold = int(badge["condition"].split(">= ")[1])
            earned = gen_count >= threshold
        elif "streak >= " in badge.get("condition", ""):
            threshold = int(badge["condition"].split(">= ")[1])
            earned = streak >= threshold
        elif "brands >= " in badge.get("condition", ""):
            threshold = int(badge["condition"].split(">= ")[1])
            earned = brand_count >= threshold
        elif "campaigns >= " in badge.get("condition", ""):
            threshold = int(badge["condition"].split(">= ")[1])
            earned = campaign_count >= threshold
        elif "platforms >= " in badge.get("condition", ""):
            threshold = int(badge["condition"].split(">= ")[1])
            earned = platform_count >= threshold
        
        if earned:
            new_badges.append(badge)
    
    if new_badges:
        all_badges = list(current_badge_ids) + [b["id"] for b in new_badges]
        conn.execute("UPDATE users SET badges=? WHERE id=?", (json.dumps(all_badges), user_id))
        conn.commit()
    
    return new_badges

@app.get("/gamification")
def get_gamification(user=Depends(get_current_user)):
    conn = get_db()
    try:
        uid = user["user_id"]
        u = conn.execute("SELECT xp, level, streak_current, streak_best, badges FROM users WHERE id=?", (uid,)).fetchone()
        if not u:
            return {"xp": 0, "level": 1, "streak": 0}
        
        # Check for new badges
        new_badges = check_badges(conn, uid)
        
        xp = u["xp"] or 0
        level = u["level"] or 1
        next_level_xp = level * 100
        
        earned_ids = set(json.loads(u["badges"] or "[]"))
        all_badges = []
        for b in BADGE_DEFINITIONS:
            all_badges.append({**b, "earned": b["id"] in earned_ids})
        
        return {
            "xp": xp,
            "level": level,
            "xp_to_next_level": next_level_xp - xp,
            "next_level_xp": next_level_xp,
            "streak_current": u["streak_current"] or 0,
            "streak_best": u["streak_best"] or 0,
            "badges": all_badges,
            "new_badges": new_badges,
            "gen_count": conn.execute("SELECT COUNT(*) FROM generations WHERE user_id=?", (uid,)).fetchone()[0],
        }
    finally:
        conn.close()

# ---------- INSPIRATION FEED ----------
@app.get("/inspiration")
def get_inspiration_feed():
    """Curated trending content ideas and marketing hooks (0 AI calls)"""
    import random
    
    hooks = [
        {"category": "Hook", "tip": "Start with a bold question", "example": "What if I told you your morning chai could double as a marketing strategy?", "platform": "LinkedIn"},
        {"category": "Hook", "tip": "Use numbers for credibility", "example": "We grew our Instagram from 200 to 20,000 followers in 90 days. Here's how:", "platform": "Instagram"},
        {"category": "Hook", "tip": "Challenge a common belief", "example": "Unpopular opinion: The best time to post on LinkedIn is NOT 9 AM", "platform": "LinkedIn"},
        {"category": "Hook", "tip": "Start with a story", "example": "Last Diwali, we made a ₹200 ad that outperformed our ₹2 lakh campaign...", "platform": "Instagram"},
        {"category": "Format", "tip": "Carousel Education Post", "example": "Slide 1: Bold statement → Slides 2-8: Tips → Slide 9: CTA", "platform": "Instagram"},
        {"category": "Format", "tip": "Before/After Transformation", "example": "Show the transformation your product/service creates", "platform": "Instagram"},
        {"category": "Format", "tip": "Twitter Thread Deep-Dive", "example": "🧵 I spent 3 months studying Indian D2C brands. Here are 10 lessons:", "platform": "Twitter"},
        {"category": "Format", "tip": "LinkedIn Poll + Follow-up", "example": "Post a poll, then create content from the results", "platform": "LinkedIn"},
        {"category": "Trending", "tip": "Meme Marketing", "example": "Take a trending meme format and adapt it to your brand context", "platform": "Instagram"},
        {"category": "Trending", "tip": "Founder Story Content", "example": "Share your startup journey — failures, pivots, and lessons", "platform": "LinkedIn"},
        {"category": "Trending", "tip": "Day-in-the-Life Reel", "example": "Show what a typical day looks like at your company", "platform": "Instagram"},
        {"category": "Trending", "tip": "Customer Success Story", "example": "Interview a happy customer and share their experience", "platform": "YouTube"},
        {"category": "Indian", "tip": "Jugaad Innovation Story", "example": "Share how your team found a creative Indian-style solution", "platform": "LinkedIn"},
        {"category": "Indian", "tip": "Festival-Linked Product Showcase", "example": "Connect your product to an upcoming festival theme", "platform": "Instagram"},
        {"category": "Indian", "tip": "Regional Language Reels", "example": "Create content in Hindi/Tamil/Telugu to reach wider audience", "platform": "Instagram"},
        {"category": "Indian", "tip": "Street Food Analogy", "example": "Compare your product to chai/samosa — making complex topics relatable", "platform": "Twitter"},
        {"category": "Growth", "tip": "Collab with Micro-Influencers", "example": "Partner with 5-10 niche creators instead of 1 celebrity", "platform": "Instagram"},
        {"category": "Growth", "tip": "User-Generated Content Contest", "example": "Ask customers to share photos with your product using a branded hashtag", "platform": "Instagram"},
        {"category": "Growth", "tip": "LinkedIn Carousel With Data", "example": "Share industry stats in a visually appealing carousel format", "platform": "LinkedIn"},
        {"category": "Growth", "tip": "Reply to Comments with Video", "example": "Pick interesting comments and reply with short video responses", "platform": "Instagram"},
    ]
    
    random.shuffle(hooks)
    return hooks[:12]

@app.get("/")
def read_root():
    return {"message": "Content Studio AI Backend is Running", "version": "3.0"}
