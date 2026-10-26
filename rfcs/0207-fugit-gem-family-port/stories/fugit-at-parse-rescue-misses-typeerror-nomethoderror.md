---
title: "fugit At.parse rescue nil misses the TypeError standing in for NoMethodError"
status: ready
updated: 2026-10-26
rfc: "0207-fugit-gem-family-port"
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

Differential fuzz (`scripts/fugit-fuzz`, seed 20261025) found ~180 inputs where Ruby answers `nil` and the port raises. `Fugit::At.parse` is `::EtOrbi.make_time(s) rescue nil` (`vendor/fugit/v1.11.1/lib/fugit/at.rb:11`); `rescue nil` catches `StandardError`, including the `NoMethodError` Chronic raises on a short token list (`vendor/chronic/v0.10.2/lib/chronic/handlers.rb`, `handle_od_rm`: `tokens[2].get_tag`) and fugit's nat `Slot#hour_range` raises (`vendor/fugit/v1.11.1/lib/fugit/nat.rb`, `@data0.match`). The port (`packages/fugit/src/at.ts`, `At.parse`) rescues only `instanceof StandardError`, so the JS `TypeError` that stands in for `NoMethodError` (CLAUDE.md, "Ruby protocol methods with a different JS mechanism") escapes.

Minimal inputs: `Fugit.parse("each 7nd of the month")`, `Fugit.parse("each t\thu")` — Ruby `nil`, TS `TypeError`.

## Acceptance criteria

- [ ] Decide (owner ruling if needed) how a ported `rescue` / `rescue StandardError` treats a JS `TypeError` from a call on `undefined`, and apply it in `At.parse`.
- [ ] The two inputs above answer `nil`; regression cases go in `packages/fugit/src/fugit.trails.test.ts`.
