# Visual Redesign & GME Tracker Quality Polish Request

Please perform a comprehensive visual redesign and quality polish across the entire Next.js 14 + TypeScript QI Project Tracker application. The objective is to establish a premium GME-branded dashboard, implement custom interactive components, and ensure maximum visual appeal with clean animations, responsive grid layouts, and absolute static-export compatibility (`next export`).

---

## 🎨 Global Styling & Brand Parameters
- **Styling Core**: Tailwind CSS and Lucide React.
- **Brand Palette**:
  - `advent-navy` (primary dark blue: `#0F172A` / `#1E293B`)
  - `advent-cobalt` (hover active blue: `#2563EB`)
  - `advent-blue` (accent blue: `#3B82F6`)
- **Visual Atoms**:
  - White cards with rounded-3xl (`rounded-[2rem]`) corners, border `border-slate-200/60`, and subtle drop shadows (`shadow-sm`).
  - Uppercase tracking-widest text elements (`text-[9px]` or `text-[10px] font-black uppercase tracking-[0.2em]`).
  - Emerald green for success/completed states.
- **Status Accents**:
  - `Idea` -> Violet (primary accent)
  - `Pre-Intervention` -> Blue
  - `Intervention Ongoing` -> Amber
  - `Sustain the Gains` -> Cyan
  - `Impacted (Completed)` -> Emerald

---

## 🛠️ Phase-by-Phase Component Upgrades

### 1. Status Badges (`src/components/StatusBadge.tsx`)
- Redesign status indicator badges with animated ping circles and status-mapped HSL color tokens.
- Ensure status text is clean, bold, and modern.

### 2. Custom UI Component Suite (`src/components/ui/custom-ui.tsx`)
- **Toast Notifications**: Implement custom `toast` systems with success, error, warning, and informational styling.
- **Confirm Dialogs**: Create a customizable confirmation modal (`CustomConfirmDialog`) with animated entrance effects and clean overlay backdrops.
- **Skeleton Loaders**: Design customizable skeleton screen components (`Skeleton`) for seamless fallback loading states.

### 3. Welcome Dashboard (`src/app/page.tsx`)
- Upgrade the primary workspace greeting banner with soft modern gradients.
- Redesign stat metrics cards, sidebar search tools, filter inputs, and project list layouts.
- Integrate full-page skeleton loading screen state triggers.

### 4. App Shell & Header (`src/components/AppShell.tsx` & `src/components/Header.tsx`)
- Refactor the main navigation header to include interactive visual cues, dynamic routing highlights, active-nav pills, and GME logo alignment.
- Integrate unified skeleton loading templates within `AppShell` during initial user load.

### 5. Charts & Analytics (`src/components/DashboardCharts.tsx`)
- Customize analytical chart visuals to reflect dynamic status colors.
- Enhance interactive tooltips, grid markers, and cumulative timeline trackers for GME progress.

### 6. Pipeline Pipeline Cards & Kanban Board (`src/components/ProjectCard.tsx` & `src/components/KanbanBoard.tsx`)
- **Project Cards**: Add smooth scaling animations (`hover:scale-[1.01] hover:-translate-y-0.5`), glowing borders on completion, and status timeline micro-bars.
- **Kanban Board**:
  - Expand columns to exactly 5 to fully support the "Impacted (Completed)" stage.
  - Implement dynamic empty-column drop states, and show a success toast warning on completion changes.

### 7. Form Upgrades & AI Helpers (`src/app/projects/new/page.tsx` & `src/app/projects/edit/page.tsx`)
- Organize inputs into visual groups. Mark mandatory options with red asterisks (`*`).
- Build a persistent sticky action footer bar containing "Save Changes" and "Cancel" with smooth transitions.
- Integrate client-side AI helper buttons:
  - **SMART Aim Optimizer**: Refines user text into objective aims.
  - **Duplication Checker**: Flags matching titles to prevent repeats.
  - **AI Outline Drafter**: Autocompletes structure parameters based on metadata.

### 8. Academic Portfolios (`src/app/portfolio/page.tsx`)
- Restore missing portfolio state variables and header imports.
- Design a resident graduation milestone checklist panel (e.g. "Core Project Lead", "PDSA Completed", "Faculty Mentor Sign-Off").
- Create an interactive print/export container for curriculum vitae (CV) and mentorship credentials.

### 9. Impact Dashboard & Outcomes (`src/app/impact/page.tsx` & `src/components/ImpactDashboard.tsx`)
- Upgrade outcome metrics:
  - Patient volume counters.
  - Estimated cost savings ROI card.
  - Value-based clinical safety benchmarks.

### 10. Analytical Metrics & Filters (`src/app/metrics/page.tsx`)
- Polish analytical graphs, timeline controllers, and custom date range filters.

---

## 🌟 Project Detail Page: Status-Colored Header (`src/app/projects/view/page.tsx`)
1. **Dynamic Color Mapping**:
   Create a map matching the project's status to specific high-fidelity Tailwind gradients, borders, and ambient glow values:
   - **`Idea`**: Violet theme (`from-violet-50/70 via-violet-50/30 to-white/10`, `border-violet-100`, `bg-violet-500` glow)
   - **`Pre-Intervention`**: Blue theme (`from-blue-50/70 via-blue-50/30 to-white/10`, `border-blue-100`, `bg-blue-500` glow)
   - **`Intervention Ongoing`**: Amber theme (`from-amber-50/70 via-amber-50/30 to-white/10`, `border-amber-100`, `bg-amber-500` glow)
   - **`Sustain the Gains`**: Cyan theme (`from-cyan-50/70 via-cyan-50/30 to-white/10`, `border-cyan-100`, `bg-cyan-500` glow)
   - **`Impacted (Completed)`**: Emerald theme (`from-emerald-50/70 via-emerald-50/30 to-white/10`, `border-emerald-100`, `bg-emerald-500` glow)

2. **Status Hero Header Banner**:
   - Wrap the main project details into a unified premium banner at the top of the page (`p-8 md:p-10 rounded-[2.5rem] border bg-gradient-to-br shadow-sm relative overflow-hidden`).
   - Add a subtle background glow (`absolute -right-24 -top-24 w-80 h-80 rounded-full blur-[100px] opacity-10`) that maps dynamically to the status accent.
   - Position the following inside the hero banner:
     - **Metadata Line**: Current `StatusBadge` and last updated date text side-by-side.
     - **Main Title**: High-contrast `h1` heading (`text-3xl md:text-4.5xl font-black text-slate-900 tracking-tight leading-tight`).
     - **Tags**: `ProjectTags` component just below the title.
     - **Actions**: A responsive flex cluster containing `ProjectReportGenerator`, `NudgeButton`, and the "Edit Project" button.

3. **Workflow Progression Card**:
   - Extract the 5-Stage horizontal workflow indicator from the old title block.
   - House it inside a beautiful standalone white card immediately below the hero banner (`bg-white border border-slate-200/60 rounded-[2rem] p-6 shadow-sm`). 
   - Ensure the horizontal progression logic (colors and steps matching active stage index) remains fully operational.

---

## ⚡ Static Compatibility & Verification
- Do not introduce server-side functions (e.g. `getServerSideProps` or route handlers that break static generation).
- All changes must compile successfully without TypeScript, eslint, or build errors when executing:
  ```bash
  npm run build
  ```
