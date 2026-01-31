
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model_name = "gemini-2.5-flash-image"

print(f"Testing {model_name}...")

try:
    model = genai.GenerativeModel(model_name)
    print("Model instantiated.")
    response = model.generate_content("Draw a cute robot")
    print("Response received.")
    print(response.text if hasattr(response, 'text') else "No text")
    
    if response.parts:
        for part in response.parts:
            print(f"Part mime type: {part.mime_type}")
            if "image" in part.mime_type:
                print("Image detected in response!")
except Exception as e:
    print(f"Error: {e}")
