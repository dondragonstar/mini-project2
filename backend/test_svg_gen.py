
import asyncio
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-1.5-flash")

async def generate_svg_image(model, prompt):
    try:
        svg_prompt = f"""
        Create a SIMPLE, MINIMALIST SVG illustration based on this description: "{prompt}".
        
        Requirements:
        - Use a modern, artistic vector style.
        - Use vibrant colors compatible with a dark background.
        - The SVG should be valid XML.
        - Do NOT add ```xml or ```svg code blocks. Just return the <svg>...</svg> code string.
        - Limit complexity to ensure it renders quickly (under 2KB if possible).
        """
        response = await model.generate_content_async(svg_prompt) # Async test
        text = response.text
        # Cleanup logic replication
        if "```xml" in text:
            text = text.replace("```xml", "").replace("```", "")
        if "```svg" in text:
            text = text.replace("```svg", "").replace("```", "")
        return text.strip()
    except Exception as e:
        print(f"SVG Generation failed: {e}")
        return None

async def main():
    print("Testing SVG Gen...")
    svg = await generate_svg_image(model, "A futuristic neon city")
    print("Result start:", svg[:50])
    print("Result end:", svg[-20:])
    if "<svg" in svg:
        print("Success: SVG tag found")
    else:
        print("Failure: No SVG tag")

if __name__ == "__main__":
    asyncio.run(main())
