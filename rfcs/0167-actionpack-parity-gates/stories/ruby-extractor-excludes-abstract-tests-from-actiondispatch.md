---
title: "Stop counting test/abstract/*_test.rb in actiondispatch's Ruby test population"
status: draft
updated: 2026-09-27
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/test-compare/extract-ruby-tests.rb:2401-2405` removes `controller/`
from actiondispatch's Ruby test files ("handled by actioncontroller"), but not
`abstract/`, which abstractcontroller also claims. So
`abstract/callbacks_test.rb` (26), `abstract/collector_test.rb` (5) and
`abstract/translation_test.rb` (21) score 52/52 in
`pnpm parity:test --package abstractcontroller` and 0/52 — "missing", with
convention paths `abstract/*.test.ts` that no one should create — in
`--package actiondispatch`.

## Acceptance criteria

- actiondispatch's selection excludes `abstract/` the way it excludes
  `controller/`, and a `scripts/` test pins it.
- `pnpm parity:test --package actiondispatch` reports 1045/1637 (was
  1045/1689) and lists no `abstract/` file; abstractcontroller still reports
  52/52; no other package moves. The PR body states the before/after.
