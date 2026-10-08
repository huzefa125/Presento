# Presento

Real-time interactive presentation platform (Mentimeter-style). Two apps in this repo:

- `backend/` - Express + MongoDB (Mongoose) + Socket.IO. Entry point `src/server.js`.
- `frontend/` - React 19 + Vite + Tailwind. Entry point `src/main.jsx`.

Run each from its own directory: `npm run dev` in `backend/` (nodemon) and
`npm run dev` in `frontend/` (vite). `backend/.env` and `frontend/.env` hold the
environment config for each.

## Before writing backend or frontend code, read `CODE_STANDARDS.md`

It describes the shared helpers both apps already have for error handling, API
responses, pagination, auth tokens, logging and async state - e.g. backend
controllers should be `asyncHandler(async (req, res) => { ... throw notFound('X') ...
ok(res, data) })`, not a hand-rolled `try { } catch (error) { console.error(...);
res.status(500).json(...) }`. New code should use these helpers; don't reintroduce the
pattern they replace. The doc is not fully adopted everywhere yet - when you're
already editing a file that still does it the old way, bring that file in line with
the doc rather than leaving it as the odd one out, but don't go mass-rewrite unrelated
files in the same change.

## Linting and formatting

```bash
cd backend && npm run lint   # or frontend/
cd backend && npm run format # prettier --write, same config at repo root
```

## Tests

```bash
cd backend && npm test   # jest
```

Frontend has no test runner configured yet.
