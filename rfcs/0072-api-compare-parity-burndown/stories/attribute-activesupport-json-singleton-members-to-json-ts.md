---
title: "attribute-activesupport-json-singleton-members-to-json-ts"
status: done
updated: 2026-08-07
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6166
claim: "2026-08-07T02:48:26Z"
assignee: "attribute-activesupport-json-singleton-members-to-json-ts"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activesupport/lib/active_support/json.rb` is two `require`s, so
parity:api maps no Rails file onto `packages/activesupport/src/json.ts` —
`pnpm parity:api:extra --package activesupport` reports it as
`json.ts — 1 novel, 3 moved [no Rails counterpart]`.

The consequence: the `module ActiveSupport::JSON` half of
`json/encoding.rb:15-44` (`encode`, `decode`, and the `dump` alias added by
`port-activesupport-json-dump-alias`) is scored **nowhere**. The
`json/encoding.rb → json/encoding.ts` pair reports 13/13, which is the `module
Encoding` half only; adding `dump` did not move any number, because there is no
attribution for the singleton half to move.

Ruby puts both modules in `json/encoding.rb`; trails splits them across
`json.ts` and `json/encoding.ts` deliberately (`json.ts`'s header cites
`json/encoding.rb:15-42`).

## Acceptance criteria

- [ ] `scripts/api-compare/conventions.ts` maps the `ActiveSupport::JSON`
      singleton members of `json/encoding.rb` onto `json.ts` (or `json.rb` is
      mapped to `json.ts` and the members attributed through it), so `encode` /
      `decode` / `dump` are scored.
- [ ] `json.ts` stops reporting `[no Rails counterpart]`.
- [ ] `pnpm parity:api` deltas are non-negative.
