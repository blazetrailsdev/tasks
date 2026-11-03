---
title: "Generate framework constant tables over Inflector"
status: claimed
updated: 2026-11-02
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: zw-framework
packages: ["scripts", "zeitwerk"]
deps: ["zeitwerk-loader-config-and-helpers"]
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: "2026-11-02T23:56:40Z"
assignee: "framework-constant-table-generator-over-inflector"
blocked-by: null
closed-reason: null
---

## Context

Replaces `framework-constant-table-generator`, whose inflector was deleted by trails#9619: trails has no Ruby packaging concept, so packages are npm packages described by `package.json`. `scripts/api-compare/class-paths.ts` derives tables from `rails-api.json`. RFC 0213 § "Framework constants", open question 3. `RUBY_FILE_TS_OVERRIDES` and `PATH_SEGMENT_ALIASES` become overrides of a `Zeitwerk::Inflector` instance and `collapse` entries. trails#9580 (closed unmerged) is prior art only.

## Acceptance criteria

- A generator built on `cname_for` and `Inflector` walks each package's `src/` and reproduces the existing tables; a package's root namespace comes from its package layout, and the residue is counted and recorded.
- Residue rows are overrides, or keep a `rails-api.json` source if large.
- `parity:class-paths --check` stays as the cross-check.
