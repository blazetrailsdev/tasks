---
title: "Port date-ext.ts's remaining aliases and the Date operator coercion arms"
status: done
updated: 2026-08-18
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages:
  - activesupport
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 6522
claim: "2026-08-18T14:40:54Z"
assignee: "request-forgery-protection-this-typed-mixin"
blocked-by: null
closed-reason: null
---

## Context

PR #6197 added `packages/activesupport/src/date-ext.ts`, the `Date` arm of
`activesupport/lib/active_support/core_ext/date/calculations.rb`, and repointed
that bucket at it. It ports 15 of the file's 31 names. The 16 still missing,
from `api-comparison.json`:

- `in` — `alias :in :since` (`date/calculations.rb:64`)
- `midnight`, `at_midnight`, `at_beginning_of_day` — aliases of
  `beginning_of_day` (`:70-72`)
- `midday`, `noon`, `at_midday`, `at_noon`, `at_middle_of_day` — aliases of
  `middle_of_day` (`:78-82`)
- `at_end_of_day` — alias of `end_of_day` (`:88`)
- `plus_with_duration` / `plus_without_duration` (`:90-98`),
  `minus_with_duration` / `minus_without_duration` (`:100-107`) — the
  `ActiveSupport::Duration` arms of `Date#+` / `Date#-`
- `compare_with_coercion` / `compare_without_coercion` (`:152-159`) — `Date#<=>`
  coercing a `Time` through `to_datetime`

The aliases are one line each. The `*_with_duration` / `*_with_coercion` pairs
are Rails' `alias_method` chaining idiom around the operators, which trails has
no established spelling for on a `Temporal.PlainDate` receiver — that is the
part worth thinking about before writing.

## Converged shape

Port the ten aliases as named exports delegating to their target, exactly as
`alias` does. For the four operator pairs, decide the trails spelling once
(free functions `plusWithDuration(date, other)` / `minusWithDuration` /
`compareWithCoercion` taking the receiver first, matching the rest of the file)
and port both arms of each — the `with`/`without` split is Rails' own
decomposition and both names are measured.

## Acceptance criteria

- [ ] The ten aliases exist and delegate; no reimplementation.
- [ ] `plus_with_duration` / `minus_with_duration` / `compare_with_coercion` and
      their `_without_` counterparts are ported with Rails' branch order.
- [ ] `parity:api` `core_ext/date/calculations.rb` matched count rises from 15;
      `pnpm parity:api:calls` green.
