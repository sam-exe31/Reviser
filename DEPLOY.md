# Deploying Reviser

Reviser ships as a **single service**: the Spring Boot jar serves the REST API
*and* the built React SPA (bundled into the jar at `/static`), backed by one
managed PostgreSQL database. Same origin → no CORS, one URL, one process.

---

## 0. Before anything: rotate the secrets  ⚠️

The previous local build embedded a real Gemini API key and a local DB password
in `application.properties` (now removed) and inside already-built jars on disk.
Treat both as **compromised**:

1. **Rotate the Gemini API key** in Google AI Studio (delete the old one, create
   a new one). You'll paste the new key into Render, never into the repo.
2. Treat the local Postgres password as disposable (it never leaves your machine
   once secrets are externalized).
3. **Delete the stale jars that still embed the old key** before pushing:
   ```bash
   rm -rf target desktop/dist-app desktop/reviser.jar
   ```
   They regenerate cleanly on the next build. (They're also git-ignored, so they
   won't be committed even if present — this is just disk hygiene.)

---

## 1. Local sanity check (one jar serving everything)

```bash
./mvnw clean package -DskipTests
```

This runs the frontend build (via `frontend-maven-plugin`) and bundles the SPA
into the jar. Confirm the SPA is inside:

```bash
jar tf target/*.jar | grep "static/index.html"
```

Run it against a local Postgres:

```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/Reviser \
SPRING_DATASOURCE_USERNAME=postgres \
SPRING_DATASOURCE_PASSWORD=postgres \
GEMINI_API_KEY=your-new-key \
java -jar target/*.jar
```

Open <http://localhost:8080> — the SPA loads, API calls are same-origin (no CORS
errors in DevTools), and `curl http://localhost:8080/actuator/health` → `{"status":"UP"}`.

---

## 2. Push to GitHub

```bash
git init
git add .
git commit -m "Reviser: Slate Focus theme + one-service deploy"
```

Verify nothing sensitive is staged **before** creating the remote:

```bash
git ls-files | grep -iE 'jar|\.log$|\.env$'          # → should print nothing
git grep -i "AQ\.\|api.key=AQ" -- ':!DEPLOY.md'      # → should print nothing
```

Then create the GitHub repo and push (`git remote add origin … && git push -u origin main`).

---

## 3. Deploy on Render

1. **New + → Blueprint**, select the repo. Render reads `render.yaml` and creates
   the `reviser-db` Postgres + `reviser` web service.
2. On the **reviser** service → **Environment**, set the two manual vars:
   - `GEMINI_API_KEY` → your **rotated** key.
   - `SPRING_DATASOURCE_URL` → from the **reviser-db → Info** page, take the
     Internal host and database name and enter:
     ```
     jdbc:postgresql://<internal-host>:5432/<database>
     ```
     ⚠️ It **must** start with `jdbc:postgresql://`. Render's own connection
     string starts with `postgresql://` — Spring can't parse that form.
   - (`SPRING_DATASOURCE_USERNAME` / `PASSWORD` are wired automatically.)
3. Save → Render redeploys. On first boot, `ddl-auto=update` creates the schema.
4. Open the service URL: SPA + API on one origin, theme toggles, review flow
   works, `/<url>/actuator/health` is `UP`.

To confirm the offline path, temporarily blank `GEMINI_API_KEY`: the app still
runs with **generic** (non-personal) fallback plans.

---

## Notes

- **Free tier** spins down when idle; the first request after a nap is slow.
- **Desktop app** is unaffected: `cd desktop && npm start` boots Postgres +
  the jar and loads the same UI from `http://localhost:8080`.
- **Local dev** (`npm run dev` in `frontend/`) talks to `:8080` via
  `frontend/.env.development`; production builds use relative URLs
  (`frontend/.env.production`).
