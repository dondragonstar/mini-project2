# Content Studio AI

A modern web application that generates culturally authentic marketing content tailored for the Indian audience. Powered by AI, designed for impact.

## Quick Start

### Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

### Frontend (React + Vite)

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

## Next Steps

- Integrate Gemini API for AI-powered content generation
- Add more customization options
- Implement content history and favorites
