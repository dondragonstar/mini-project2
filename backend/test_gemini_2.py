import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

print("Checking available models...")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"- {m.name}")
            
    print("\nTesting Generation...")
    model = genai.GenerativeModel('gemini-2.0-flash-exp') # Trying 2.0 Flash Exp which might be what they meant or 1.5
    response = model.generate_content("Hi")
    print(f"Success with 2.0-flash-exp: {response.text}")
except Exception as e:
    print(f"2.0 Flash Failed: {e}")
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content("Hi")
        print(f"Success with 1.5-flash: {response.text}")
    except Exception as e2:
        print(f"1.5 Flash Failed: {e2}")
