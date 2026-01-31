
import google.generativeai as genai
import inspect

output = []
try:
    output.append(f"Version: {genai.__version__}")
    output.append(f"Top level dir: {dir(genai)}")
except Exception as e:
    output.append(f"Error: {e}")

with open("genai_info.txt", "w") as f:
    f.write("\n".join(output))
