---
title: "I-2 — type_for_attribute enum write-casting"
status: in-progress
updated: 2026-06-08
rfc: "0000-ar-test-compare-100"
cluster: unblockers
deps: []
deps-rfc: []
est-loc: 150
pr: 3013
claim: "2026-06-08T00:28:40Z"
assignee: "i2-enum-cast"
blocked-by: null
---

## Context

`where({ enumCol: "label" })` predicate-builder cast path is not routed through
the type caster. `typeForAttribute` exists (`enum.ts:78`, `table-metadata.ts:35`);
the gap is the where/predicate-builder path only (serialize read-path shipped #2687).

Gates: relation "missing with enum\*" (5), PG `enum_test.rb` (5), MySQL
`mysql_enum` "enum with attribute" (1).

## Acceptance criteria

- [ ] `where({ enumCol: "label" })` casts through the enum type.
- [ ] The 5 relation "missing with enum\*" skips green.
- [ ] Split into sibling `<base>`/`<base>b` PRs (>300 LOC total).

## Notes

Ours: `enum.ts:78`, `model_schema.ts`, `table-metadata.ts:35`.
Rails: `lib/active_record/enum.rb`, `model_schema.rb` (`type_for_attribute`).
