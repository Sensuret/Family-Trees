# Family Trees

A beautiful web application for tracking and visualizing your family tree. Create your family, add members, explore relationships, and see your lineage come to life with interactive visualizations.

## Features

- **Family-based Authentication** — Create a family with a shared family code. Individual members sign up with their own passwords using the family code to join.
- **Interactive Family Tree** — Zoomable, pannable D3.js tree visualization with color-coded gender nodes, spouse connectors, and click-to-explore functionality.
- **Member Management** — Add, edit, and remove family members with details like birth date, birth place, maiden name, and bio.
- **Relationship Finder** — Select any two family members to discover their exact relationship (e.g., "Uncle", "2nd Cousin 1x Removed").
- **Beautiful UI** — Modern, responsive design with gradient accents, smooth animations, and mobile-friendly layouts.

## Tech Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS + D3.js
- **Backend:** FastAPI (Python) + SQLAlchemy + SQLite
- **Auth:** JWT tokens with bcrypt password hashing

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+

### Backend Setup

```bash
cd backend
pip install -e .
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and proxies API calls to the backend on port 8000.

## Pages

| Page | Description |
|------|-------------|
| **Login/Register** | Create a family account or sign in with your credentials |
| **Home** | Dashboard with family stats, quick actions, and recent members |
| **Family Tree** | Interactive D3.js visualization of your entire family tree |
| **Members** | Grid view of all family members with search and CRUD operations |
| **Member Detail** | Individual profile with family connections (parents, siblings, children, spouse) |
| **Relationships** | Find the relationship between any two family members |
