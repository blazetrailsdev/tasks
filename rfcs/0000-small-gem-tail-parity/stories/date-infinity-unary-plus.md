---
title: "Port Date::Infinity#+@"
status: draft
updated: 2026-11-09
rfc: "0000-small-gem-tail-parity"
cluster: null
packages:
  - "date"
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

`pnpm parity:api` (2026-11-09) date 9/10: `Date::Infinity#+@`
(`vendor/date/v3.4.1/lib/date.rb:33`, `def +@() self.class.new(+d) end`). Its
siblings `-@`, `<=>`, `coerce` landed with `port-date-infinity-from-lib-date-rb`.
`+@` is a Ruby operator name; its TS spelling comes from the operator rows in
`docs/ruby-ts-conventions.md`.

## Acceptance criteria

- [ ] `+@` is ported under the conventions table's spelling beside `-@`.
- [ ] `pnpm parity:api` reports date 10/10.
