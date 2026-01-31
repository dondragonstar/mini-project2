import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
print(f"API Key loaded: {api_key[:5]}...{api_key[-5:] if api_key else 'None'}")

if not api_key:
    print("Error: No API Key found.")
    exit(1)

genai.configure(api_key=api_key)

try:
    print("Attempting to list models...")
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(m.name)
            
    print("\nAttempting generation with gemini-1.5-flash...")
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content("Hello, can you hear me?")
    print(f"Response: {response.text}")
    print("Success!")
except Exception as e:
    print(f"\nError occurred: {e}")
