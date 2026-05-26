# 🗺️ 5-Day IntervieHire Roadmap

> **Goal**: Build an end-to-end, real-time hiring dashboard (Next.js + FastAPI + WebSockets) that beats Zeko AI in both aesthetics (dark glassmorphism) and technology (native WebSockets instead of polling).

---

## ✅ Day 1: Foundation & Scaffolding (COMPLETED)
**Objective:** Set up the repositories, align on the data protocol, and get the structural shells running.
- **Frontend (You):** 
  - Scaffolding Next.js (App Router, TypeScript).
  - Designing the base layout (`page.tsx`) with the Sidebar and Main Area.
  - Applying the CSS variables for the Dark Glassmorphism theme.
  - Setting up the TypeScript definitions (`websocket.ts`) for our data protocol.
- **Backend (Partner):** 
  - Setting up FastAPI with `uvicorn`.
  - Creating the Connection Manager for WebSocket broadcasting.
  - Writing the Pydantic schemas to validate incoming/outgoing JSON.
  - Establishing the `/ws` route to handle ping, echo, and broadcast events.

---

## 🏃 Day 2: The Real-Time Engine
**Objective:** Build the core WebSocket pipeline so data flows instantly between server and client.
- **Frontend (You):**
  - Build a robust `useWebSocket` React hook that manages the connection lifecycle.
  - Add auto-reconnect logic (exponential backoff) so the UI gracefully handles drops.
  - Build the global `StatusIndicator` (green/amber/red) to show live connection status.
- **Backend (Partner):**
  - Implement dynamic room/channel logic (e.g., subscribing to specific job roles).
  - Connect the WebSocket manager to dummy/mock candidate data streams.
  - Add robust error handling to send `{ type: "error" }` payloads back to the client.

---

## 🏗️ Day 3: UI Components & Data Wiring
**Objective:** Recreate the key Zeko features we extracted, but powered by our live WebSocket data.
- **Frontend (You):**
  - **Candidate Funnel Chart**: Build the visual SVG/CSS funnel for candidate drops (Total -> Resume -> Screening).
  - **Live Data Tables**: Wire up the candidate lists to update *instantly* when the backend pushes a new event.
  - **Score Distribution**: Implement the bar chart for candidate scores.
  - **Toasts**: Build real-time notification popups that appear when the backend broadcasts a new event.
- **Backend (Partner):**
  - Build out the HTTP endpoints for initial data fetches (to populate the page before the WebSocket takes over).
  - Create the background task simulator that will randomly push "candidate applied" or "interview completed" events to the frontend for testing.

---

## ✨ Day 4: Polish, Animations & "Beat Zeko" Features
**Objective:** Take the UI from functional to premium. This is where we beat the competition.
- **Frontend (You):**
  - Add Skeleton Loaders (shimmering sweep animations instead of Zeko's basic blink).
  - Implement smooth page transitions and card hover-lift effects.
  - Add staggered entrance animations for list items (`fadeInSlideUp`).
  - Implement mobile responsiveness (Slide-out drawer for the sidebar).
- **Backend (Partner):**
  - Optimize WebSocket payload sizes.
  - Write integration tests to ensure the server handles 100+ concurrent WebSocket connections smoothly.

---

## 🚀 Day 5: Deployment & Handoff
**Objective:** Get the app live and reproducible.
- **Frontend (You):**
  - Write the `Dockerfile` for the Next.js frontend.
  - Write a `docker-compose.yml` to spin up both the FastAPI backend and Next.js frontend with one command.
  - Finalize documentation (`README.md`).
- **Backend (Partner):**
  - Write the `Dockerfile` for the FastAPI backend.
  - Ensure logging is structured and ready for production.
  - Conduct a final code review of the frontend WS integrations.

---
> **Current Status**: We are currently at the transition between Day 1 and Day 2! The boilerplate is fully scaffolded, and we are ready to build the `useWebSocket` hook next.
