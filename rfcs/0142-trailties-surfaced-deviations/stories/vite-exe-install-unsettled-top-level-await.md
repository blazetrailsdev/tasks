---
title: "vite-exe-install-unsettled-top-level-await"
status: draft
updated: 2026-11-22
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`node packages/vite-assets/dist/exe/vite.js install`, the `bin/vite install` the app generator's vite branch
relies on, exits with "Warning: Detected unsettled top-level await" at
`const { CLI } = await import("../cli.js")` (packages/vite-assets/lib/exe/vite.ts:5), writing nothing.
`trails vite:install` is also unrecognized (only `vite:verify_install` is listed). Found building
examples/chatter, which fell back to a hand-written vite.config.ts.

## Acceptance criteria

- `bin/vite install` in a generated app writes config/vite.json, vite.config.ts and the entrypoint
  (packages/vite-assets/lib/cli/install.ts), as vite_ruby's `ViteRuby::CLI::Install` does.
- A test runs the exe as a child process and asserts it exits 0.
