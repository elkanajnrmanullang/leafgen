# LeafGenn (Private)

Automasi desain leaflet promosi ritel (monorepo):
- `frontend/` : React (Editor, Template Library)
- `backend/`  : Laravel + PostgreSQL (Produk, Template, Render/Export)
- `docs/`     : Draft skripsi & artefak penelitian (SUS, black-box, dsb.)

## Quick Start
1) `git clone` (SSH) → buat `.env` sesuai contoh.
2) `cd frontend` → `npm i` → `npm run dev`
3) `cd backend`  → `composer i` → set DB → `php artisan migrate`

## Branching
Trunk-based: `main` stabil, fitur pakai `feature/<scope>`.

## Commit
Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`).
