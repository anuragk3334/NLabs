# Neighborhood Library - React Frontend

A basic React UI for the library service. Talks to the Spring Boot REST API
running on http://localhost:8080.

## Run it

Requires Node.js 18+.

```bash
npm install
npm run dev
```

Opens on http://localhost:3000.

Make sure the backend is running first (see the backend README).

## Screens

- **Books** - add/edit books, see how many copies are available.
- **Members** - add/edit members.
- **Loans** - borrow a book, return a book, and filter by member or
  "currently borrowed only".

## Notes

- All API calls go through `src/api.js`.
- Navigation between the three screens is handled with simple state in
  `App.jsx` (no router, since there are only three views).
- The backend URL is set at the top of `src/api.js` if you need to change it.
