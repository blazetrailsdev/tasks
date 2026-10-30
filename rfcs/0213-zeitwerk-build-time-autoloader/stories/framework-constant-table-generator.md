---
title: "Generate framework constant tables over GemInflector"
status: ready
updated: 2026-10-30
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: zw-framework
packages: ["scripts", "zeitwerk"]
deps: ["zeitwerk-loader-config-and-helpers"]
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/class-paths.ts` derives tables from `rails-api.json`. RFC 0213 § "Framework constants", open question 3. `RUBY_FILE_TS_OVERRIDES` and `PATH_SEGMENT_ALIASES` become inflector overrides.

## Acceptance criteria

- A generator built on `cname_for` and `GemInflector` reproduces the existing tables, and the residue is counted and recorded.
- Residue rows are overrides, or keep a `rails-api.json` source if large.
- `parity:class-paths --check` stays as the cross-check.
