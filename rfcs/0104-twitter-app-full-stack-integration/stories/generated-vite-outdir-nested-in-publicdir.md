---
title: "Generated vite.config nests outDir inside publicDir, duplicating public files and doubling the assets path"
status: done
updated: 2026-09-02
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: ["trailties"]
deps: ["generated-layout-hardcodes-undigested-asset-path"]
deps-rfc: []
est-loc: 60
priority: 9
pr: 7374
claim: "2026-09-02T01:41:37Z"
assignee: "generated-vite-outdir-nested-in-publicdir"
blocked-by: null
closed-reason: null
---

## Context

The generated `vite.config.ts` nests its build output inside its own public
directory, so every `vite build` copies `public/` into `public/assets/` and
emits the entry one level deeper than intended.

`packages/trailties/src/generators/app-generator.ts` emits:

```ts
root: "app",
publicDir: "../public",
build: { outDir: "../public/assets", manifest: true },
```

`outDir` is a subdirectory of `publicDir`, and Vite says so on every build:

```text
(!) The public directory feature may not work correctly. outDir
.../trailmap/public/assets and publicDir .../trailmap/public are not
separate folders.
```

Reproduced on trails `84eae0131` (post-#7371), Node 24, vite 7.3.6, in an app
straight from `trails new` with one stylesheet. After `pnpm exec vite build`:

```text
public/assets/404.html
public/assets/422.html
public/assets/500.html
public/assets/favicon.ico
public/assets/robots.txt
public/assets/assets/application-tn0RQdqM.css
public/assets/.vite/manifest.json
```

Two consequences, both verified against a running server on the Rack-only path
(no Vite):

- **Static files are served at two URLs.** `/robots.txt` and
  `/assets/robots.txt` both return 200. The duplicates are build output, so
  they drift from the originals and are re-copied on every build.
- **The entry lands at `assets/assets/...`.** The doubled segment is why the
  built stylesheet answers at `/assets/assets/application-<hash>.css`. This
  compounds `generated-layout-hardcodes-undigested-asset-path` — that story
  fixes the layout to read the manifest, but the manifest points into the
  doubled path, so the generated layout is not the only thing that has to
  change for a built app to load its CSS.

Rails keeps compiled output and static public files apart —
`public/assets` is written by the asset pipeline while `public/` itself is
hand-maintained, and the pipeline never copies one into the other.

## Acceptance criteria

- `outDir` and `publicDir` are separate folders; `vite build` emits no public
  directory warning.
- A built app has no copies of `404.html`, `422.html`, `500.html`,
  `robots.txt` or `favicon.ico` under its build output, and each is served at
  exactly one URL.
- The built entry lands at a single `assets/` level, and the manifest path
  matches what the server serves.
- A test builds a generated app and asserts the emitted tree, so the layout
  cannot silently regain a doubled segment.
