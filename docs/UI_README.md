# llm-memory Web UI

## Overview

The llm-memory Web UI is a lightweight, single-page Vue 3 application that provides a control interface for managing and querying architectural policies.

## Features

### Dashboard
- Real-time system health monitoring (Agent, PostgreSQL, LLM Provider)
- Quick stats showing total policies and last check time
- Auto-refresh every 30 seconds

### Policy Browser
- View all policies with search/filter capability
- Expandable policy details showing full value and metadata
- Real-time search across key, description, and value fields

### Query Tester
- Test queries against the agent
- View query results with latency metrics
- See matched policy sources
- History of recent queries

### Policy Form
- Add new policies via web form
- Edit existing policies
- Form validation (key format, required fields)
- JSON value support

## Tech Stack

- **Frontend**: Vue 3 (Composition API)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Pinia
- **HTTP Client**: Axios
- **Language**: TypeScript

## Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup
```bash
# Install dependencies
npm install

# Start development server (UI only)
npm run dev:ui

# Access at http://localhost:5173
```

### Building
```bash
# Build UI
npm run build:ui

# Build backend
npm run build

# Build both
npm run build:all
```

The UI is built to `dist/ui/` and served by the agent at `/ui`.

## Production

The UI is served as static files by the Express backend:

```bash
# Start the agent (with UI)
npm start

# Access UI at http://localhost:3000/ui
```

## Project Structure

```
src/ui/
├── components/          # Vue components
│   ├── Dashboard.vue    # System health dashboard
│   ├── StatusCard.vue   # Reusable status display
│   ├── PolicyBrowser.vue # Policy list and search
│   ├── SearchBar.vue    # Search input component
│   ├── QueryTester.vue  # Query testing interface
│   └── PolicyForm.vue   # Add/edit policy form
├── pages/
│   └── Home.vue         # Main page with tabs
├── stores/
│   └── app.ts           # Pinia store for state
├── App.vue              # Root component
├── main.ts              # Entry point
├── style.css            # Global styles
└── index.html           # HTML template
```

## API Endpoints Used

- `GET /health` - System health status
- `GET /policies` - List all policies
- `GET /policies/:key` - Get single policy
- `POST /policy` - Create/update policy
- `POST /query` - Query agent

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

Mobile responsive design supports viewports 320px and wider.
