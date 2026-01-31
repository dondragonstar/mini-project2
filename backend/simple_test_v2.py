
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model_name = "gemini-flash-latest"

try:
    print(f"Testing {model_name}...")
    model = genai.GenerativeModel(model_name)
    print(model.generate_content("Hello").text)
    print("Success!")
except Exception as e:
    print(f"Failed: {e}")
