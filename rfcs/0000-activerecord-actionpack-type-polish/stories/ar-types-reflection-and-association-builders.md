---
title: "Reflection and association builder parameters typed"
status: draft
updated: 2026-11-16
rfc: "0000-activerecord-actionpack-type-polish"
cluster: type-polish-activerecord
packages: [activerecord]
deps: [type-polish-count-double-casts]
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`reflection.ts` (54), `associations/builder/association.ts` (20),
`associations/builder/belongs-to.ts` (17) and `autosave-association.ts` (26)
pass `reflection: any` / `model: any` / `record: any` (30, 23 and 66 such
parameters across `lib/`). The reflection classes exist
(`AssociationReflection`, `ThroughReflection`, ...); the parameters just do
not name them.

## Acceptance criteria

- [ ] Combined hits in those four files fall by at least 60%.
- [ ] Each `reflection: any` names the reflection class Rails passes there,
      a union where Rails accepts several.
- [ ] No discriminated-union refactor of reflection (RFC 0009 W4 is out of
      scope).
