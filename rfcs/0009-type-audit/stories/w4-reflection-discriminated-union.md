---
title: "W4 — Reflection discriminated union (deferred, high risk)"
status: draft
updated: 2026-06-03
rfc: "0009-type-audit"
cluster: type-cleanup
deps: []
deps-rfc: []
est-loc: 300
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Reflection inherently doesn't know subclass shapes, so code uses
`(this as any).macro`, `(this as any).joinPrimaryKey`, etc. (P2 — ~96 sites in
`reflection.ts`, 22 `this as any` confirmed). Introduce a discriminated union on
`AbstractReflection.macro` with branded `macro` field + typed helpers
(`(this as ReflectionWithMacro<"hasMany">)`).

See RFC 0009 §Pattern taxonomy (P2) and §Wave 4.

## Acceptance criteria

- [ ] Discriminated union on `AbstractReflection.macro` with branded field
- [ ] Typed helper(s) replace the worst `(this as any)` reflection casts
- [ ] No regression across reflection consumers
- [ ] (Likely splits into multiple PRs — re-scope when picked up)

## Notes

Status `draft` — **deferred indefinitely**: high risk (reflection is consumed
everywhere), multi-PR. Do last, after all other type-audit waves are clean, or
accept the casts as Rails-parity tax. ~500 LOC cap is nominal — will split.
