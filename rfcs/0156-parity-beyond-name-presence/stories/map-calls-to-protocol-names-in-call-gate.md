---
title: "Map calls to inspect/dup/to_h/to_a in the call gate, per enrolled package"
status: ready
updated: 2026-09-23
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8006 scores `PROTOCOL_DEFINITION_NAMES` (`inspect`, `pretty_print`, `dup`, `initialize_copy`, `initialize_dup`, `encode_with`, `init_with`, `to_a`, `to_h`, `to_hash`) per DEFINITION in enrolled packages, via `rubyMethodToTs(name, siblings, pkg)` in `scripts/parity/conventions.ts`. Call-site mapping is untouched: `lint-calls` / `compare.ts#significantMissingCalls` pass `rubyMethodToTs` with no package, so a Rails body's call TO `inspect` / `dup` / `to_h` / `to_a` is still dropped from the call set.

Measured on trails#8006's branch: mapping these names for calls in every package adds 72 call-gate rows, e.g. `activerecord schema-dumper.ts table` omits `inspect`, `activesupport deep-mergeable.ts deep_merge` omits `dup`, `activerecord tasks/database-tasks.ts migrations_paths` omits `to_a`. By the same argument #8006 used for definitions, these names translate directly (`rbInspect`, `dup()`, `toArray`, `toH`), so a dropped `.dup` in a port is a real, invisible miss.

## Acceptance criteria

- Calls to `PROTOCOL_DEFINITION_NAMES` are mapped in the call set, behind the same only-grow per-package enrollment (or a sibling list), using the JS spellings trails already uses (`rbInspect`, `toArray`, …) as call aliases.
- Each enrolled package's new rows are converged in the TS bodies, not baselined. Unenrolled packages each get a burndown story that lists their rows.
- `parity:api:calls` and `parity:api:calls:args` are green.
