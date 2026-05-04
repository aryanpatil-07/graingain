# GrainGain

**GrainGain** is a premium AI-powered smart city web app that turns restaurant surplus into actionable impact by helping NGOs identify, analyze, and request edible food before it goes to waste.

**Live Demo:** https://graingain-app.netlify.app/

---

## Problem

Cities waste enormous amounts of edible food every day while NGOs and communities struggle to access fresh meals quickly.

The core challenge is not just food waste — it is the lack of a fast, intelligent system that can:

- identify surplus food early
- estimate urgency and safety
- match food with nearby NGO partners
- support quick pickup decisions

---

## Solution

GrainGain solves this with a **story-driven AI workflow** that connects food surplus to social impact.

The app helps users:

- describe surplus food
- analyze food type and expiry urgency
- locate nearby NGO partners on a map
- discover nearby restaurants with surplus potential
- schedule pickup and request surplus food

---

## Key Features

- **Cinematic hero experience** for a strong first impression
- **AI food analysis** to estimate food type, safe hours, and urgency
- **Impact dashboard** with waste, meals rescued, and methane reduction metrics
- **Story flow section** explaining the process from waste to value
- **Interactive NGO map** with nearby partner selection
- **Premium restaurant cards** showing surplus potential and risk
- **Delivery timing slider** for scheduling pickup
- **Logistics summary** with distance, ETA, food details, and request action
- **Final CTA section** designed for strong demo conversion
- **Responsive, modern UI** built for hackathon presentation impact

---

## How It Works

1. **Describe the surplus**  
   Enter a short food description.

2. **AI analyzes the food**  
   The app estimates food type, safe time window, and urgency.

3. **Select an NGO**  
   Use the map to choose a nearby NGO partner.

4. **Review nearby restaurants**  
   See restaurant surplus opportunities and waste risk.

5. **Schedule pickup**  
   Adjust timing with the delivery slider.

6. **Request surplus food**  
   Send the pickup request from the logistics summary panel.

---

## Tech Stack

- **Frontend:** React
- **Styling:** Custom CSS
- **Maps:** Leaflet
- **Animations:** Scroll-based UI interactions and smooth visual transitions
- **Deployment:** Netlify

---

## Project Structure

- `client/src/App.js` — main app flow and UI orchestration
- `client/src/components/` — reusable UI components
- `client/src/data/` — NGO and restaurant data
- `client/src/styles/` — premium visual styling
- `services/aiService.js` — AI-related service logic
- `server.js` — backend API for analysis

---

## Local Setup

```bash
npm install
cd client
npm install
npm start
