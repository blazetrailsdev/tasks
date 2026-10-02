---
title: "pairCallSites breaks a same-name tie by the Ruby receiver's name, not source order"
status: draft
updated: 2026-10-01
rfc: "0179-api-compare-crediting-rules"
cluster: call-args
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pairCallSites` (`scripts/api-compare/call-args.ts`) sorts same-named candidates by
`score`, then `block`, then `rubyIdx`, then `tsIdx`. When a TS body has one MORE
same-named site than the Ruby body — the second arm of a conditional — the spare
site ties with the correct one and source order decides.

Found on PR trails#8307 while porting
`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_set/builder.rb:36-39`:

    keys = values.keys | types.keys | @attributes.keys

against a `LazyAttributeSet#keys` whose `values` arm reads a Hash or an
`IndexedRow` (`!isPlainObject(v) ? v.keys() : Object.keys(v)`). The Ruby sites
are `keys` with receivers `values`, `types`, `@attributes`; the TS sites are
`keys()` recv `values`, `keys(values)`, `keys(types)`, `keys(_attributes)`.
`@attributes` ties between `keys(values)` and `keys(_attributes)` and takes the
earlier one, so the naming gate reports `receipt-on-convergeable … keys keys
(attributes)` against the existing `@missingRailsName attributes — PERMANENT`
receipt. Written hash-arm-first, `@attributes` instead pairs with the row's
argument-less `keys()` as an exact match and the receipt reads `stale-receipt`.

A working tie-break was prototyped and removed with the story it served
(`load-from-sql-iterates-indexed-rows`, which will hit this):

    function receiverAffinity(ruby: CallSite, ts: CallSite): number {
      const rubyRef = ruby.recv?.match(/^id:@?(\w+)$/)?.[1];
      const tsRef = (ts.recv ?? ts.args[0])?.match(/^id:_?(\w+)$/)?.[1];
      return rubyRef !== undefined && tsRef !== undefined && snakeToCamel(rubyRef) === tsRef ? 1 : 0;
    }

sorted after `block` and before `rubyIdx`. It kept `call-args.test.ts` (127
tests) and both call gates green repo-wide. Restricting the Ruby side to a real
`recv` matters: reading `ruby.args[0]` as a receiver breaks "scores arity after
the built-in receiver is stripped, not before".

## Acceptance criteria

- [ ] `pairCallSites` breaks a score tie toward the TS site whose receiver (or
      receiver-as-first-arg) is the Ruby receiver's own name modulo `@` / `_` /
      camelCase.
- [ ] A `call-args.test.ts` case with the four `keys` sites above pairs
      `@attributes` with `keys(_attributes)` in BOTH arm orders.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green with
      no baseline row added.
