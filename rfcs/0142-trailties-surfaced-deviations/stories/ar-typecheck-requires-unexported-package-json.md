---
title: "ar-typecheck-requires-unexported-package-json"
status: done
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: trails#8233
claim: "2026-09-28T21:36:54Z"
assignee: "ar-typecheck-requires-unexported-package-json"
blocked-by: null
closed-reason: null
---

## Context

`ar typecheck` crashes on every project:

```text
ar: Package subpath './package.json' is not defined by "exports" in .../packages/activerecord-cli/package.json imported from .../activerecord-cli/dist/delegate.js
```

`delegateBin` (`packages/activerecord-cli/src/delegate.ts:7,13`) does
`req(`${pkg}/package.json`)` for `@blazetrails/activerecord-cli` itself
(`cli.ts:383`), but that package's `exports` map exposes only `.` and `./tsc`.

Found re-running the `activerecord-cli` README quickstart (PR #8195) on `main` at `c19bfc0aee`.

## Acceptance criteria

- [ ] `ar typecheck` runs `trails-tsc` in a freshly generated `ar new` project.
- [ ] The e2e suite covers `ar typecheck`, so the exports map cannot silently regress it.
