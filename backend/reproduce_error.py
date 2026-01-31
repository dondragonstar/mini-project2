
import requests
import json

url = "http://localhost:8000/generate"

payload = {
    "brand_name": "TestBrand",
    "topic": "Future Tech",
    "level": 1
}

try:
    print(f"Sending request to {url}...")
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print("Response Text:")
    print(response.text)
except Exception as e:
    print(f"Error: {e}")
