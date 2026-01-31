
import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

def test_imagen_rest():
    # Attempting the standard endpoint for imagen on the public API
    # Note: The availability of this endpoint depends on the API key tier.
    url = f"https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key={API_KEY}"
    
    headers = {
        "Content-Type": "application/json"
    }
    
    payload = {
        "instances": [
            {
                "prompt": "A futuristic city with neon lights, high quality, 8k"
            }
        ],
        "parameters": {
            "sampleCount": 1
        }
    }
    
    print(f"Testing URL: {url.replace(API_KEY, 'API_KEY')}")
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:500]}")
        
        if response.status_code == 200:
            print("Success! Image generated (base64 likely in response).")
        else:
            print("Failed to generate image via REST.")
            
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_imagen_rest()
