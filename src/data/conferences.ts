// Static fallback conference list — used when conferences_registry table is unavailable
// The live data comes from constants/conferences.ts via Supabase

export const STATIC_CONFERENCES = [
  { id: "sgim", name: "SGIM Annual Meeting", short_name: "SGIM", abstract_deadline: "2025-12-01", event_date: "2026-04-22", specialty: "General Internal Medicine" },
  { id: "acp", name: "ACP Internal Medicine Meeting", short_name: "ACP", abstract_deadline: "2025-10-15", event_date: "2026-03-26", specialty: "Internal Medicine" },
  { id: "shm", name: "SHM Converge", short_name: "SHM", abstract_deadline: "2025-11-01", event_date: "2026-04-09", specialty: "Hospital Medicine" },
  { id: "asco", name: "ASCO Annual Meeting", short_name: "ASCO", abstract_deadline: "2026-02-06", event_date: "2026-05-29", specialty: "Oncology" },
  { id: "acc", name: "ACC Scientific Session", short_name: "ACC", abstract_deadline: "2025-09-05", event_date: "2026-03-28", specialty: "Cardiology" },
  { id: "aha", name: "AHA Scientific Sessions", short_name: "AHA", abstract_deadline: "2026-06-04", event_date: "2026-11-07", specialty: "Cardiology" },
  { id: "ash", name: "ASH Annual Meeting", short_name: "ASH", abstract_deadline: "2026-06-09", event_date: "2026-12-05", specialty: "Hematology" },
  { id: "aan", name: "AAN Annual Meeting", short_name: "AAN", abstract_deadline: "2025-10-02", event_date: "2026-04-05", specialty: "Neurology" },
];
