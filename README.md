# 🌿 Moksha Manager

An interactive event planning and crowd simulation platform for **NSUT's Moksha cultural fest**. Act as the fest operations manager: move stages and stalls, adjust budgets, shift schedules, and watch every decision ripple through crowd flow, queues, and safety.

> ⚠️ **Planning simulator only.** The campus map is **illustrative** until actual venue data is verified. Every number is a simulated estimate, not real data and not a certified crowd-safety system.

---

## ✨ Features

### 🗺️ Interactive campus map
- Top-down festival layout with main and secondary stages, food and merch stalls, sponsor booths, gates, walkways, washrooms, a medical point, and emergency exits
- Drag to relocate, add, remove, open, or close any facility
- Hover cards and tooltips show live details for facilities, walkways, and controls

### 👥 Crowd simulation
- Animated attendees walk from gates to attractions along walkways
- Footfall, queues, walking distances, and congestion recalculate whenever the layout, capacity, schedule, or attendance changes
- Play/pause, 1×–8× speed, a time scrubber (16:00–23:00), and a density heatmap

### 🌊 Ripple engine
- Every significant change logs a cause-and-effect chain with the reason for each step
- Click a ripple entry to highlight the affected facilities and walkways on the map

### 💰 Budget management
- Adjust spending on stages, sound, lighting, stalls, security, sanitation, medical, and logistics
- Spending changes service rates, security staffing, gate throughput, and medical capacity, and raise or lower the related risks

### 📊 Operations dashboard and Analytics tab
- Live attendance, crowd pressure, congested routes, queue times, budget use, and staffing gaps
- A separate **Analytics** tab keeps the main view uncluttered. It has stat tiles, line charts over the whole evening, and bar charts for queues, walkway load, and budget
- Charts compare the current plan with the baseline

### 🧪 Scenario lab
- Presets: stage relocation, food court relocation, budget cut, blocked walkway, delayed headliners
- Baseline comparison, scenario saving, undo/redo, and reset

### 🛟 Recovery suggestions
- Recommended layout, route, schedule, and budget changes, each with benefits and trade-offs
- Preview a suggestion on the map before applying it

### ⚙️ Dynamic crowd handling
- **Gates:** entry speed scales with Logistics spend, and long entry queues turn some people away
- **Security:** a surplus acts as marshals and eases walkway load, while a shortage lets crowds bunch up
- **Medical:** incident load rises with congestion against medical capacity
- **Movement:** crowds slow down on congested walkways

---

## 🛠️ Tech stack

| Layer | Choice |
| --- | --- |
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Simulation | Deterministic, rule-based engine in plain TypeScript |
| Charts | Hand-built SVG, no chart library |

No backend, paid APIs, or credentials are required.

---

## 🚀 Getting started

```bash
npm install
npm run dev
```

Open the local URL that Vite prints.

```bash
npm run build   # production build in /dist
```

---

## 📁 Project structure

```
moksha-manager/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
└── src/
    ├── main.tsx        # entry point
    ├── index.css       # Tailwind import + theme tokens
    ├── engine.ts       # simulation, ripple engine, scenarios, suggestions
    ├── App.tsx         # map, controls, inspector, timeline, dashboard
    └── Analytics.tsx   # stats and graphs tab
```

---

## 🧠 How the simulation works

1. **Scene state** holds facilities, budget, peak attendance, schedule delay, and walkway status.
2. **Attendance** follows an evening curve, reduced by gate queues.
3. **Demand** for each attraction depends on its pull, whether a performance is live, its distance from open gates, and queue aversion.
4. **Routing** assigns visitors from gates to attractions over a 3×3 junction graph of 12 walkways (W1–W12). Routes avoid congested walkways, and blocked walkways are removed from the graph.
5. **Metrics** such as queues, walkway load, walking distance, security gap, evacuation time, and medical load are derived from this state.
6. **Ripples** come from evaluating the scene before and after each decision and explaining the biggest differences.

The same inputs always produce the same results.

---

## 🎨 Design

A calm, editorial look with warm off-white, deep forest green, muted teal, and amber used only for warnings.

---

## ⚠️ Limitations

- The map layout, capacities, and rates are sample data.
- Saved scenarios are not persisted across page reloads.
- Stage 2's schedule is not editable.
- This is not a substitute for a professional crowd-safety assessment.

---

## 📄 License

Built for educational and planning use. Add your preferred license before distribution.
