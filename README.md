## Lohnsteuer Rechner (Next.js)

## Getting Started

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tests

```bash
npm run test:tax
```

## GitHub Pages Deployment

This project is configured for static export and GitHub Pages:
- `next.config.ts` uses `output: "export"` and dynamic `basePath` via `NEXT_PUBLIC_BASE_PATH`.
- Workflow: `.github/workflows/deploy-pages.yml`
- Deploy trigger: push to `main`

### One-time repo settings
- GitHub Repository -> Settings -> Pages
- Build and deployment -> Source: `GitHub Actions`

### Local production-style build
For project pages, set the base path to the repo name:

```bash
NEXT_PUBLIC_BASE_PATH=/REPO_NAME npm run build
```

For user/organization pages (`username.github.io`), leave it empty:

```bash
NEXT_PUBLIC_BASE_PATH= npm run build
```
