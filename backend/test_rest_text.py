
import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

def test_gemini_rest():
    # URL for gemini-1.5-flash
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={API_KEY}"
    
    headers = {
        "Content-Type": "application/json"
    }
    
    payload = {
        "contents": [{
            "parts": [{"text": "Write a short poem about coding."}]
        }]
    }
    
    print(f"Testing URL: {url.replace(API_KEY, 'API_KEY')}")
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        print(f"Status Code: {response.status_code}")
        print("Response Text:")
        print(response.text[:500])
        
        if response.status_code == 200:
            print("Success! REST API works.")
        else:
            print("Failed via REST.")
            
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_gemini_rest()
