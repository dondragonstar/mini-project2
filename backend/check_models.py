
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

print(f"GenAI version: {genai.__version__}")

target_model = "gemini-2.5-flash-image"

print(f"\n--- Testing 1: ImageGenerationModel with {target_model} ---")
try:
    if hasattr(genai, "ImageGenerationModel"):
        model = genai.ImageGenerationModel(target_model)
        response = model.generate_images(
            prompt="A cute robot holding a neon sign saying 'Hello'", 
            number_of_images=1
        )
        print("Success! Image generated.")
        # Just verifying it works, no need to save for this test if it doesn't crash
    else:
        print("genai.ImageGenerationModel does not exist in this version.")
except Exception as e:
    print(f"Failed: {e}")

print(f"\n--- Testing 2: Fallback to imagen-3.0-generate-001 ---")
try:
    if hasattr(genai, "ImageGenerationModel"):
        model = genai.ImageGenerationModel("imagen-3.0-generate-001")
        response = model.generate_images(
            prompt="A simple red box",
            number_of_images=1
        )
        print("Success with fallback!")
    else:
        print("Skipping fallback due to missing class.")
except Exception as e:
    print(f"Fallback Failed: {e}")
