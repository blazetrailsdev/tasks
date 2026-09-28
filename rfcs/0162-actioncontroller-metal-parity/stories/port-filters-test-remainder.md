---
title: "Port the rest of filters_test.rb"
status: draft
updated: 2026-09-28
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "port-actionpack-abstract-unit-test-support",
    "append-action-aliases-missing",
    "action-callbacks-invented-name-option-shadows-symbol-filter-dedup",
  ]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionpack/test/controller/filters_test.rb` (1068 lines)
reports 17/52 in `pnpm parity:test --package actioncontroller`, with 4 empty
skip stubs and 31 missing:

- `FilterTest` (`:20-981`): 20 missing and 4 skipped, all between Rails lines
  540 and 848 — around actions (with properties, prepended and appended,
  rescuing), rendering and redirecting in a `before_action` breaking the chain
  for `after_action` / `prepend_after_action`, mixed specialization order,
  dynamic dispatch, skipping and reordering (`skip_before_action` with
  conditions, including when the parent and siblings are conditional), and
  `only:` / `except:` on implicit actions.
- `YieldingAroundFiltersTest` (`:983-1066`): all 11 missing — `around_action`
  with a symbol, class, instance and proc; nesting; action order with every
  action type and with `skip_*`; and which action in a multi-`before_action`
  chain halts.

`packages/actionpack/src/action-controller/controller/filters.test.ts` also
carries 17 tests with no Rails counterpart.

## Acceptance criteria

- Every missing and skipped test is ported in Rails order under its Rails class.
- The 17 extra tests move to `filters.trails.test.ts` unless they duplicate a
  Rails test, in which case they are deleted.
- `pnpm parity:test --package actioncontroller` reports `filters_test.rb` 52/52
  with no extra.
