# components — presentational only

Props in, JSX out. No data fetching, no business logic, no database access.
Pages under `app/` fetch from the backend API and pass typed props down.

Types may be imported; runtime imports from `app/` are a lint error.
