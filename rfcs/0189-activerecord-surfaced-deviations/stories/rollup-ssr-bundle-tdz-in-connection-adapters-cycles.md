---
title: "Rollup/Vite SSR bundles throw TDZ in activerecord connection-adapters cycles"
status: done
updated: 2026-11-19
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: trails#10324
claim: "2026-11-18T22:37:37Z"
assignee: "adapter-load-path-pulls-only-the-configured-driver"
blocked-by: null
closed-reason: null
---

## Context

Rollup/Vite SSR builds of a trails app throw at load: Rollup builds the frozen namespace object
for `activerecord`'s `connection-adapters` before `class ConnectionHandler` is initialized, so it
fails with `ReferenceError` (TDZ). This happens with `inlineDynamicImports` both true and false, and the build
itself succeeds with 62 activerecord circular-dependency warnings. esbuild handles the same graph.
Found in the serverless spike (`/home/dean/.btwhooks/data/github/blazetrailsdev/trails/audits/serverless-20261118T171557Z.md`, B7).

Vite-based serverless hosts (Vercel, Netlify, SvelteKit-style adapters) cannot run a trails app
until this is fixed.

## Acceptance criteria

- Inventory the cycles Rollup reports, and identify the module-eval reads (root CLAUDE.md
  § "Call-time constant resolution") that make the namespace object observe TDZ.
- Converge them onto the sanctioned shapes, so that a Rollup SSR bundle of a minimal app
  (posts index on SQLite) loads and serves a request.
- Add a check, a script or a test, that builds the minimal app with Rollup and imports it.
