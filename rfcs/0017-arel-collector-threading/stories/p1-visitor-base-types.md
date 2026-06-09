---
title: "Phase 1 — Visitor base type strengthening"
status: claimed
updated: 2026-06-09
rfc: "0017-arel-collector-threading"
cluster: arel-collector-threading
deps: []
deps-rfc: []
est-loc: 50
priority: 1
pr: null
claim: "2026-06-09T19:15:40Z"
assignee: "p1-visitor-base-types"
blocked-by: null
---

## Context

`Visitor.visit(object, collector?)` in `visitor.ts` already conditionally passes
the collector to the dispatched method (line 67). The return type is currently
`unknown`. Before converting `ToSql`, strengthen the base types so the Phase 2
work is cleanly typed from the start.

See RFC §Design — "Visitor base".

## Acceptance criteria

- [ ] `Visitor.visit()` return type strengthened (or a `Collector` interface
      added if needed to express the return)
- [ ] No behavioral change — pure type strengthening
- [ ] `pnpm vitest run packages/arel/src/visitors/visitor.test.ts` passes
- [ ] TypeScript build clean (`pnpm -r build` or `pnpm tsc --noEmit` in arel)

## Notes

This is intentionally small and backward-compatible. The goal is to land a clean
type foundation before the larger Phase 2 conversion. If the existing `unknown`
return on `Visitor.visit` is acceptable without a `Collector` interface, this
phase may be folded into Phase 2.

Rails source: `vendor/rails/activerecord/lib/arel/visitors/visitor.rb`.
