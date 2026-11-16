---
title: "activemodel lib without double casts"
status: draft
updated: 2026-11-16
rfc: "0000-activerecord-actionpack-type-polish"
cluster: type-polish-neighbours
packages: [activemodel]
deps: [type-polish-count-double-casts]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

activemodel `lib/` has 42 `as unknown as` and 8 `any`. `secure-password.ts`
holds 14; the rest are casts to `Record` (12), `RecordWithRawAttribute`,
`HostAsClass` and `ValidationsContextHost` in `conversion.ts`,
`attribute-registration.ts`, `naming.ts`, `validations.ts` and
`validations/numericality.ts`.

## Acceptance criteria

- [ ] activemodel `lib/` `as unknown as` ≤ 15 and `any` ≤ 2.
- [ ] Host casts become `this`-typed functions or `Included<>` per
      CLAUDE.md § "Module mixins".
- [ ] `hasSecurePassword` adds typed `password` / `authenticate` members
      without a cast at the call site.
