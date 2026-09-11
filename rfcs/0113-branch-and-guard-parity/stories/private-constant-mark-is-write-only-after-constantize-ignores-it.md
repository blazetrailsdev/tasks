---
title: "privateConstant's mark is write-only now that constantize ignores constant visibility"
status: draft
updated: 2026-09-11
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in trails#7718, which made `constantize` / `safeConstantize` resolve a
`privateConstant`-marked name. MRI's `Object.const_get("A::B")` ignores constant
visibility; only the lexical `A::B` reference raises `private constant A::B referenced`.

That left `_privateConstants` in `packages/activesupport/src/inflector.ts` written by
`privateConstant` (called from `packages/activerecord/src/associations.ts`, mirroring
`associations.rb:1877-1878`'s `private_constant`) and cleared by
`unregisterConstant` / `_resetConstants`, but read by nothing. The trails-only tests
"unregistering a constant drops its private mark" and "a rebound constant keeps its
private mark" in `private-constant.trails.test.ts` now assert nothing about privacy.

## Converged shape

Either give the mark its Ruby reader (`Module#const_defined?` / `constants` visibility,
the `A::B` lexical path) and a caller that consults it, or delete the set and the
tests that pin it. Keep `associations.ts`'s `privateConstant` call only if it records
something that is read.

## Acceptance criteria

- [ ] No write-only constant-visibility state remains in `inflector.ts`.
- [ ] `private-constant.trails.test.ts` asserts only observable behaviour.
