
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

print(f"Version: {genai.__version__}")
print("Attributes in genai:", dir(genai))

print("\n--- Model List ---")
for m in genai.list_models():
    if "image" in m.name.lower() or "vision" in m.name.lower():
        print(f"Found related model: {m.name}")
        print(f"Methods: {m.supported_generation_methods}")
