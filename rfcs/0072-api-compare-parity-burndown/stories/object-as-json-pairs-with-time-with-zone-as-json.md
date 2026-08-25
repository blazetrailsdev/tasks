---
title: "object-as-json-pairs-with-time-with-zone-as-json"
status: done
updated: 2026-08-08
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6225
claim: "2026-08-08T10:03:54Z"
assignee: "object-as-json-pairs-with-time-with-zone-as-json"
blocked-by: null
closed-reason: null
---

## Context

`parity:api` pairs Ruby `Object#as_json`
(`vendor/rails/activesupport/lib/active_support/core_ext/object/json.rb:58-66`)
with `TimeWithZone#asJson` (`packages/activesupport/src/time-with-zone.ts`),
reported under `tsFile: index.ts` — the re-export site — rather than with the
actual port, `Object.asJson` in
`packages/activesupport/src/core-ext/object/json.ts:30`. The resolution is by
bare short name (`asJson`), and the path-proximity tiebreak does not reach the
`core-ext/object/` file.

The mis-pairing was invisible until `core_ext/object/instance_variables.rb` was
ported (PR for `port-object-instance-values-for-as-json`): `Object#as_json`'s
call to `instance_values` then had a ported counterpart to demand, and the
call-parity gate flagged `TimeWithZone#asJson` for omitting it. It is baselined
at `scripts/api-compare/call-mismatches-exclude/activesupport/index.json` with
that reason.

The same resolution also means every `asJson` arm in `core-ext/object/json.ts`
(`Module`, `Hash`, `Array`, `Enumerable`, …) is compared against whichever
`asJson` wins the short-name tie, so their call sets are effectively unchecked.

## Acceptance criteria

- [ ] Ruby `Object#as_json` resolves to `core-ext/object/json.ts`'s
      `Object.asJson`, not `time-with-zone.ts`'s.
- [ ] The `index.ts` / `as_json` / `instance_values` row is deleted from
      `scripts/api-compare/call-mismatches-exclude/activesupport/index.json`
      (only-shrink: delete the row by hand, do not reseed).
- [ ] `pnpm parity:api:calls` green; `pnpm parity:api` non-negative.
