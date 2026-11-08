---
title: "class-paths-credits-core-time-in-date"
status: ready
updated: 2026-11-08
rfc: "0199-nokogiri-html-sanitizer-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:class-paths:check` walks `packages/date/lib/time.ts` and finds `Time`, which mirrors Ruby core `Time` (`vendor/ruby/v3.3.11/time.c`) and is seated with `constSet(TopLevel, "Time", Time)`. The `date` gem's manifest has no `Time`, and `topLevelRubyConstants` in `scripts/api-compare/class-paths.ts` only exempts top-level classes that manifest lists, so the export reads as one with no Ruby counterpart. It carries `@noRailsEquivalent CONVERGEABLE class-paths-credits-core-time-in-date`.

## Acceptance criteria

- [ ] `class-paths.ts` credits a date-package class named for an MRI core class (as `CORE_CLASSES` does for ruby-compat) without a receipt.
- [ ] The receipt on `Time` is deleted.
