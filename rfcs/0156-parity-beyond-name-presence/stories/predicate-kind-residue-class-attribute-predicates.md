---
title: "Burn down the 29 class_attribute predicates in predicate-kind-mark.json"
status: draft
updated: 2026-09-26
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8115 gated `predicateKindMismatches` (`scripts/api-compare/lint-predicate-kinds.ts`,
`predicate-kind-mark.json`) at 29 rows. These are Ruby predicates `foo?` that are credited only
through a TS `foo` whose type cannot hold a boolean. The rows were checked by hand, and every one
is a `class_attribute` predicate: `activesupport/lib/active_support/core_ext/class/attribute.rb:80-84`
generates `foo?` as `!!public_send(:foo)`. Rows at merge: activerecord 12, actioncontroller 6,
activesupport 3, actiondispatch 3, activemodel 2, trailties 2, actionview 1. Examples:
`core.rb:22` `logger`, `core.rb:100` `default_role`, `model_schema.rb:163,169`,
`validations.rb:50` `_validators`, `number_helper/number_converter.rb:14` `namespace`,
`system_test_case.rb:138` `driver`, `test_case.rb:599` `_controller_class`,
`template/handlers/erb.rb:20` `escape_ignore_list`, `code_statistics.rb:45-46`.

`classAttribute()` (`@blazetrails/activesupport`) installs an `isFoo` predicate at runtime, but
where the attribute is hand-declared rather than going through `classAttribute()`, or where
the extractor cannot see the installed predicate, the Ruby predicate has no TS answer.

## Converged shape

Each row answers `foo?` with an `isFoo` whose value is `!!foo`, as `attribute.rb:80-84` does.
Declare the attribute through `classAttribute()`, which generates the predicate, rather than as
a hand-written static. The fix is never a raised mark.

## Acceptance criteria

- Burn the 29 rows down, package by package. `pnpm parity:api:predicates:tighten` narrows the
  mark as each one converges.
- `predicate-kind-mark.json` ends empty.
