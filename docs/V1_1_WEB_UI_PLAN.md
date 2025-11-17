# V1.1 Web Control Interface — Implementation Plan

**Status:** PLANNED  
**Timeline:** ~1 week after V1  
**Release Target:** December 8, 2025  
**Complexity:** Medium (React + Tailwind, ~500 LOC)

---

## 📋 Overview

A lightweight, single-page web dashboard for:
- **Viewing** system health and policy inventory
- **Testing** queries against the agent
- **Managing** policies dynamically via form (add/edit without CLI)
- **Monitoring** policy change history

**Goal:** Remove friction from policy management — non-technical users can view and update policies without CLI knowledge.

---

## 🎯 Features (Prioritized)

### Must-Have (Phase 1-2, Days 1-4)
1. **Dashboard Home**
   - Real-time health status (Agent, Postgres, Ollama)
   - Policy count, last query time
   - System uptime

2. **Policy Browser**
   - Searchable list of all policies
   - Display: key, description, value (truncated)
   - Click to view full policy details
   - Quick filter by category

3. **Query Tester**
   - Text input for test queries
   - Submit and view results with latency
   - Show matched policies and sources
   - Useful for validation before scripts

### Should-Have (Phase 3, Days 5-7)
4. **Dynamic Policy Add/Edit**
   - Web form with fields: key, value, description
   - Validation (required fields, format checks)
   - Submit creates policy in Postgres via POST /policy
   - Success/error feedback

5. **Policy History**
   - Timeline of policy changes
   - Show: date, action (add/update/delete), user, change summary
   - Requires `policy_versions` table in DB

### Nice-to-Have (V1.2+)
- Dark mode
- Export policies as JSON/YAML
- Bulk policy import
- User audit log

---

## 🏗️ Architecture

### Frontend Stack
```
Frontend:
  - Vue 3 (Composition API)
  - TypeScript (type safety)
  - Vite (build tool, fast HMR)
  - Tailwind CSS (styling, utility-first)
  - Axios or fetch (HTTP calls)
  - Pinia (lightweight state management)

Deployment:
  - Build to /dist/ui
  - Serve from Agent on GET /ui/* (static files)
  - Fallback: /ui/index.html for SPA routing
```

### Backend Changes (Minimal)
```typescript
// Add to src/agent.ts
app.use('/ui', express.static('dist/ui'));
app.get('/ui/*', (_req, res) => {
  res.sendFile('dist/ui/index.html');
});

// New endpoints for UI
app.get('/policies', async (req, res) => { /* list all */ });
app.get('/policies/:key', async (req, res) => { /* get one */ });
app.post('/policies/:key/history', async (req, res) => { /* audit trail */ });
```

### File Structure
```
src/
  ui/
    components/
      Dashboard.vue        # Main layout + health status
      PolicyBrowser.vue    # Policy list, search, details
      PolicyForm.vue       # Add/edit policy form
      QueryTester.vue      # Test queries
      StatusCard.vue       # Reusable status display
      SearchBar.vue        # Filter/search input
    pages/
      Home.vue             # Main page
    App.vue                # Root component
    main.ts                # Entry point
    index.css              # Tailwind + global styles
  ui-build.config.ts       # Vite config

scripts/
  build-ui.sh              # Build and copy to dist

dist/
  ui/
    index.html
    main-xxx.js
    main-xxx.css
```

---

## 🛠️ Implementation Steps

### Step 1: Project Setup (2 hours)
```bash
# Install dependencies
npm install -D vue @vitejs/plugin-vue
npm install -D vite
npm install -D tailwindcss postcss autoprefixer
npm install axios

# Initialize Tailwind
npx tailwindcss init -p

# Create directory structure
mkdir -p src/ui/components src/ui/pages
```

### Step 2: Vite + Vue Setup (1 hour)
- Create `vite.config.ts` with @vitejs/plugin-vue (output to dist/ui)
- Create `src/ui/main.ts` (Vue entry point)
- Create `src/ui/App.vue` (root component)
- Create `src/ui/index.css` (Tailwind directives)
- Test: `npm run dev:ui` → http://localhost:5173

### Step 3: Dashboard Component (4 hours)
- `Dashboard.tsx`: Main layout (header, sidebar, content area)
- `StatusCard.tsx`: Show Agent/Postgres/Ollama status
- Fetch `/health` every 30s
- Display: status, latency, last checked

### Step 4: Policy Browser (4 hours)
- `PolicyBrowser.tsx`: Table or card grid
- `SearchBar.tsx`: Filter by key/description
- Click row → expand details
- Display policy metadata

### Step 5: Query Tester (3 hours)
- `QueryTester.tsx`: Input + submit button
- Send POST to `/query`
- Display results, latency, sources
- Allow multiple test queries

### Step 6: Policy Form (5 hours)
- `PolicyForm.tsx`: Form with validation
- Fields: key (slug), description, value (textarea)
- Submit → POST to `/policy`
- Success notification + update list
- Error handling + user feedback

### Step 7: Build & Integration (2 hours)
- Create `build-ui.sh` script
- Update `src/agent.ts` to serve `/ui/*`
- Test served from agent at http://localhost:3000/ui
- Verify all features work

### Step 8: Testing & Polish (4 hours)
- E2E test: view → add → query → view history
- Mobile responsiveness
- Error states and edge cases
- Performance (lazy load if needed)

---

## 📊 Wireframe Sketch

```
┌─────────────────────────────────────────┐
│  llm-memory Control Panel               │
├──────────┬──────────────────────────────┤
│ Menu:    │                              │
│ • Home   │    System Status             │
│ • Search │  ┌──────────────────────┐   │
│ • Add    │  │ Agent:   ✅ OK       │   │
│ • Query  │  │ Postgres:✅ Connected│   │
│ • History│  │ Ollama:  ✅ Reachable│   │
│          │  └──────────────────────┘   │
│          │                              │
│          │  Policies: 21                │
│          │  Last Query: 3 min ago       │
│          │                              │
│          │  ┌─────────────────────────┐ │
│          │  │ Search: naming_        │ │
│          │  │ ✓ naming-conventions   │ │
│          │  │ ✓ naming-enums (match) │ │
│          │  │ ✓ code-style           │ │
│          │  └─────────────────────────┘ │
└──────────┴──────────────────────────────┘
```

---

## 🚀 Deployment

### Development
```bash
npm run dev:ui    # Vite dev server on :5173
npm run dev:agent # Agent on :3000 (uses real /health, /query endpoints)
```

### Production
```bash
npm run build:ui       # Build to dist/ui
docker-compose up      # Agent serves /ui from dist/ui
# Access: http://localhost:3000/ui
```

### GitHub Actions (Optional)
Add workflow to build UI on push, commit built files to repo.

---

## 💡 Key Design Decisions

| Decision | Why |
|----------|-----|
| **Single Page App (SPA)** | Simple, fast, no backend routing needed |
| **Vue 3 Composition API** | Lightweight, reactive, simpler than React hooks |
| **Tailwind CSS** | No component library overhead, utility-first = fast |
| **Pinia for State** | Minimal store pattern for policies list and health |
| **Client-side search** | Policies list small (<100), filter instantly |
| **Served from Agent** | No separate frontend server, one binary |

---

## ✅ Acceptance Criteria (V1.1 Release)

- [ ] Dashboard loads and shows health status (refreshes every 30s)
- [ ] All 21 policies visible and searchable
- [ ] Can add a new policy via form (persists in DB)
- [ ] Query tester returns results with correct format
- [ ] Policy history shows audit trail (add/update/delete events)
- [ ] UI responsive on desktop and tablet
- [ ] No console errors, <3s load time
- [ ] Works at http://localhost:3000/ui

---

## 📝 V1.1 Success Metrics

| Metric | Target |
|--------|--------|
| UI load time | < 2s |
| Dashboard health refresh | 30s interval |
| Query response display | < 1s after submit |
| Policy add success rate | 100% (validated form) |
| Browser compatibility | Chrome, Firefox, Safari |
| Mobile responsiveness | Works on 320px+ width |

---

## 🔄 Next Steps (After V0 Stable)

1. Create feature branch: `feature/v1.1-web-ui`
2. Set up Vite + React scaffolding
3. Build Dashboard component (high priority)
4. Iterate on feedback from daily use
5. Prepare for V1.1 release in early December

---

**Prepared by:** BMAD Workflow  
**Date:** 2025-11-17  
**Status:** Ready for Implementation After V1 Completion
