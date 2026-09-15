---
title: "whole-valued-float-seat-renders-as-integer"
status: ready
updated: 2026-09-15
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 76
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `Float#to_s` (`vendor/ruby/numeric.c:1059` `flo_to_s`) renders `1.0` as
`"1.0"`. trails#7764 ported `flo_to_s` as `floToS` in
`packages/ruby-compat/src/object.ts`, reached from `rbObjAsString` and
`rbInspect`, but a whole-valued JS `number` is read as an Integer there
(`1.0 === 1`), so a whole-valued Float still renders without a point. The same
Integer reading drives `%f`'s exact arm in `kernel-format.ts`.

Closing that gap needs a way for a Float seat to reach these functions still
marked as a Float, which a plain `number` cannot carry.

## Acceptance criteria

- [ ] A whole-valued Float can reach `rbObjAsString` / `rbInspect` / `format`
      marked as a Float, so `format("%s", 1.0) == "1.0"` and
      `format("%p", 1.0) == "1.0"` are expressible and pinned in
      `kernel-format.trails.test.ts`.
- [ ] `floToS` and `formatFloat`'s exact-arm guard take that mark before the
      `Number.isInteger` reading.
- [ ] `rbobjasstring-drops-the-float-to-s-arm` is marked done with this PR.
