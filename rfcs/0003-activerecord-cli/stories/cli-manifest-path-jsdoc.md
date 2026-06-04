---
title: "Fix ManifestResult.path JSDoc / resolution"
status: ready
rfc: "0003-activerecord-cli"
cluster: cli
deps: ["cli-generators-manifest"]
deps-rfc: []
est-loc: 5
priority: 17
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Post-merge finding from the ar-cli series (#2705). `ManifestResult.path` JSDoc
says "absolute path" but `generateManifest(modelsDir)` returns
`join(modelsDir, "index.ts")` — relative when a direct library caller passes a
relative `modelsDir`. The CLI is unaffected (always resolves against cwd first).

## Acceptance criteria

- [ ] Either resolve the path inside `generateManifest` (so it is always
      absolute) or soften the JSDoc to match actual behavior.
- [ ] `packages/activerecord-cli/src/generate-manifest.ts` JSDoc and return
      value agree.

## Notes

Migrated from `activerecord-gaps.md` (ar-cli follow-ups) during the RFC 0011
cutover.
