# Content Studio AI

A modern web application that generates culturally authentic marketing content tailored for the Indian audience. Powered by AI, designed for impact.

## Quick Start

### Backend (FastAPI)

1. Create a `.env` file in the `backend` directory with the following API keys:
   ```env
   GEMINI_API_KEY=your_gemini_key
   POLLINATIONS_API_KEY=your_pollinations_key
   ```
   *(Note: The HuggingFace API is deprecated for this project in favor of the Pollinations Image Generation API)*

2. Install dependencies and run:
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

The API will be available at `http://localhost:8000`

### Frontend (React + Vite + Tailwind v4)

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

## Project Structure

```
mini-project-temp/
├── backend/
│   ├── main.py           # FastAPI server with /generate endpoint
│   └── requirements.txt  # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.jsx       # Main React component
│   │   ├── App.css       # Component styles
│   │   ├── index.css     # Global styles (dark theme, glassmorphism)
│   │   └── main.jsx      # React entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Features

- **Dark Mode UI** with glassmorphism effects
- **Aurora background** with animated gradients
- **Shiny text animations** for the title
- **Tilted card effects** with 3D perspective
- **Blur reveal animations** for generated content
- **Neon accents** with orange/purple gradients
- **Real-time content generation** with smooth animations

## UI Effects (Inspired by React Bits)

- Aurora Background - Flowing ethereal gradient animation
- Shiny Text - Animated gradient that moves across the title
- Glass Cards - Frosted glass effect with blur
- Star Border - Glowing border on hover for buttons
- Blur Reveal - Content fades in from blur when generated
- Tilted Card - 3D perspective shift on hover

## API Endpoints

| Method | Endpoint    | Description                          |
|--------|-------------|--------------------------------------|
| GET    | `/`         | Health check                         |
| POST   | `/generate` | Generate marketing content           |

### Request Body (POST /generate)

```json
{
  "brand_name": "Your Brand",
  "industry": "Fashion & Apparel",
  "occasion": "Diwali",
  "tone": "Festive & Joyful"
}
```

### Response

```json
{
  "script": "Celebrate Diwali with Your Brand! This festive season...",
  "visual": "A beautifully composed scene featuring a diverse Indian family..."
}
```

## Technology Stack

- **Backend:** FastAPI, Python, Google Gemini (Text Gen), Pollinations API (Image Gen)
- **Frontend:** React, Vite, Framer Motion, Tailwind CSS v4
- **Aesthetics:** Glassmorphism, UI React Bits, Aurora Gradients
