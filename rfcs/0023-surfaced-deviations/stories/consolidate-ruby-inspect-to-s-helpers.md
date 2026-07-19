---
title: "Consolidate the two partial Ruby inspect/to_s ports into activesupport"
status: ready
updated: 2026-07-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while fixing #4974 (`quote-column-name-array-tos-formatting`).

There are now two independent partial ports of Ruby's `Object#inspect` /
`Array#to_s` / `String#inspect`:

- `packages/arel/src/visitors/to-sql.ts` — `rubyToS` / `rubyInspect` /
  `rubyStringInspect`, added by #4974. The complete version: named escapes for
  control characters, `\uXXXX` (uppercase, four digits) for other
  non-printables, `\#` only where a `#` would begin an interpolation. Verified
  byte-identical against real Ruby across 21 adversarial inputs.
- `packages/actionpack/src/action-dispatch/journey/formatter.ts:328-343` —
  `rubyInspectHash` / `rubyInspectArray` / `rubyInspect`, used to build the
  `No route matches ...` message. Escapes nothing inside strings, so a route
  key containing a quote, backslash, or newline renders differently from Ruby.

Both stand in for the same Ruby semantics and will drift. Any future site
needing `to_s`/`inspect` fidelity (error messages, `Model#inspect`,
`derive-fk-query-constraints-message-array-inspect-parity` territory) will make
it three.

## Scope

Extract one Ruby `inspect`/`to_s` implementation into `activesupport` and have
both call sites use it. The arel version is the reference — port its escaping
rules wholesale rather than re-deriving them.

Watch the dependency direction: `activesupport` is already a dependency of both
`arel` and `actionpack`, so this does not add an edge. Keep the arel helper
private to the module if the import would create a cycle; the actionpack
duplicate is the one that most needs replacing, since it is the incorrect one.

Verify differentially against real Ruby (`ruby -e 'puts cases.to_s'`) rather
than by inspection — that is how #4974 caught its own incomplete first pass.

## Acceptance criteria

- A single Ruby `inspect`/`to_s` helper in `activesupport`, with the full
  escaping rules
- `formatter.ts` and `to-sql.ts` both route through it; no duplicate remains
- Differential test against Ruby output covering control characters,
  interpolation-leading `#`, quotes, backslashes, and non-ASCII
- `No route matches` messages unchanged for keys with no special characters
