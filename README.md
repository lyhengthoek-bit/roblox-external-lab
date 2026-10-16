# External download site

React, Tailwind CSS 4, Motion for React, and Vite. GUI screenshots and downloads match
the v11 C++ build with movement editing removed. The browser canvas is an
explicitly labeled two-dimensional visual simulation; it never contacts Roblox
or emits Windows input.

Install: npm ci. Production build: npm run build. Development: npm run dev.
Local preview: npm run preview or node serve.cjs 4177. Type quit to stop serve.cjs.
Browser QA: node check-site.cjs http://127.0.0.1:4177.

Publication uses `.github/workflows/pages.yml`. No repository credentials
belong in this tree. Downloaded executables are not run by the website build.

Lucide icons are bundled in dist/assets under their included license.

Scroll motion uses native scrolling, sticky positioning, transforms, opacity,
and a clip-path reveal. Small screens stack screenshots instead of the pinned
sweep. Reduced-motion preferences disable spatial animation. The app download
requires the current Microsoft Visual C++ v14 x64 runtime.

## GitHub Pages

The GitHub export must contain this site's root files, `src`, `public`,
`package-lock.json`, and `.github/workflows/pages.yml`. Exclude `.openai`,
`.sites-runtime`, `.git`, `node_modules`, QA output, and all credentials. Keep the
local `.openai/hosting.json` only for the separate Sites publishing workflow.

The included Pages workflow installs locked dependencies with Node 24, builds
the static `dist` directory, and deploys it using GitHub's official SHA-pinned
Pages actions. It runs on pushes to `main` or from the Actions tab. It uses the
standard per-run GitHub token and does not require a custom token or secret.

An owner or repository administrator must first select **Settings > Pages >
Build and deployment > Source > GitHub Actions** in the intended repository.
The workflow file alone does not establish that Pages has been enabled or that
deployment succeeded. Public repositories can use Pages on GitHub Free;
private repository eligibility depends on the account plan.

Vite uses the relative base `./`, and screenshot/download paths use that same
base. The built site works from a repository subdirectory such as `/repo/` as
well as a domain root. Release files are copied unchanged from `public/downloads`
into the deployment; this workflow does not execute them or compile the C++ app.

Official setup: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
