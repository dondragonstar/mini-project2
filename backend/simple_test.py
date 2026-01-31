
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

try:
    print("Testing gemini-pro...")
    model = genai.GenerativeModel("gemini-pro")
    print(model.generate_content("Hello").text)
    print("Success!")
except Exception as e:
    print(f"Failed: {e}")
