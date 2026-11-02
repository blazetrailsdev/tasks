---
title: "Generate framework constant tables over GemInflector"
status: blocked
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
blocked-by: "Stale in-progress: trails#9580 closed unmerged 2026-11-01, and its title and first AC require GemInflector, which trails#9619 deleted (no Ruby packaging concept). Needs an owner rewrite onto Zeitwerk::Inflector or a package-layout rule plus a re-claim; framework-constant-tables-replace-class-paths and delete-register-constant-and-class-path-api wait on it."
closed-reason: null
---

## Context

`scripts/api-compare/class-paths.ts` derives tables from `rails-api.json`. RFC 0213 § "Framework constants", open question 3. `RUBY_FILE_TS_OVERRIDES` and `PATH_SEGMENT_ALIASES` become inflector overrides.

## Acceptance criteria

- A generator built on `cname_for` and `GemInflector` reproduces the existing tables, and the residue is counted and recorded.
- Residue rows are overrides, or keep a `rails-api.json` source if large.
- `parity:class-paths --check` stays as the cross-check.
