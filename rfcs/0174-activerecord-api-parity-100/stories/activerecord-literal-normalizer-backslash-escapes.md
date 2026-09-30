---
title: "tooling: the literal comparer double-counts Ruby backslash escapes (sanitize_sql_like escape_character)"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: tooling
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/output/literal-mismatches.json` reports 3 mismatches repo-wide; activerecord's is
`sanitization.rb` `escape_character` default — Ruby `"\\"` (`vendor/rails/v8.0.2/activerecord/lib/active_record/sanitization.rb:132`)
vs TS `"\\"`, the same one-backslash string. The Ruby side keeps the source escape doubled
(`"\\\\"`); actiondispatch `SUB_DELIMS` and i18n `SEPARATOR_ESCAPE_CHAR` show the same fault. The
normalizer in `scripts/api-compare/literals.ts` compares source spellings instead of decoded values.

## Acceptance criteria

- [ ] `literals.ts` decodes Ruby double-quoted escapes (`\\`, `\001`, …) before comparing, with tests for all three reported rows.
- [ ] `literal-mismatches.json` reports 0 activerecord rows (and the other two resolve or are real).

## Verification

```bash
pnpm vitest run scripts/api-compare scripts/parity
```
