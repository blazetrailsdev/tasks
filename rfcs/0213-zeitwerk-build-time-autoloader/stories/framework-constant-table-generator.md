---
title: "Generate framework constant tables over GemInflector"
status: closed
updated: 2026-11-02
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: zw-framework
packages: ["scripts", "zeitwerk"]
deps: ["zeitwerk-loader-config-and-helpers"]
deps-rfc: []
est-loc: 500
priority: null
pr: trails#9580
claim: "2026-11-01T18:29:29Z"
assignee: "framework-constant-table-generator"
blocked-by: null
closed-reason: "Replaced by framework-constant-table-generator-over-inflector: this story's AC names GemInflector, deleted by trails#9619 (no Ruby packaging concept); git grep on origin/main finds no GemInflector in packages/zeitwerk. trails#9580 closed unmerged 2026-11-01."
---

## Context

`scripts/api-compare/class-paths.ts` derives tables from `rails-api.json`. RFC 0213 § "Framework constants", open question 3. `RUBY_FILE_TS_OVERRIDES` and `PATH_SEGMENT_ALIASES` become inflector overrides.

## Acceptance criteria

- A generator built on `cname_for` and `GemInflector` reproduces the existing tables, and the residue is counted and recorded.
- Residue rows are overrides, or keep a `rails-api.json` source if large.
- `parity:class-paths --check` stays as the cross-check.
