---
title: "parity:test gate extractor cannot read currentAdapter(), forcing a trails-only gate idiom"
status: done
updated: 2026-08-31
rfc: "0126-fidelity-tooling-continuation"
cluster: null
deps: []
deps-rfc: []
est-loc: 110
priority: 5
pr: 7291
claim: "2026-08-31T14:08:44Z"
assignee: "inline-ruby-bodies-extracted-as-named-helpers"
blocked-by: null
closed-reason: null
---

## Context

The parity:test gate extractor recognizes only the `adapterType` idiom in a
`skipIf` expression:

```ts
const adapterMatch = text.match(/adapterType\s*(===|!==)\s*["']([a-z0-9]+)["']/);
```

(`scripts/test-compare/gates.ts:162`)

It does **not** recognize `currentAdapter("PostgreSQLAdapter")` — trails' port of
Rails' own `current_adapter?` predicate
(`packages/activerecord/src/support/adapter-helper.ts:47`, porting
`vendor/rails/activerecord/test/support/adapter_helper.rb`). A gate written with
the faithful helper resolves to `guards: ["unknown"]`, which the hard-zero
gate-mismatch CI check then fails as `missing-gate` / `wrong-gate`.

This bit PR #5558: four cases gated with `currentAdapter(...)` produced four
gate-mismatches and a red `Rails API/Test Comparison` job. The fix there was to
rewrite the gates in terms of `adapterType`, so the file now uses the Rails
helper in test _bodies_ (where Rails uses `current_adapter?` inline) but a
trails-only idiom in the gates.

That is a fidelity tax paid for a tooling limitation. Teaching the extractor to
read `currentAdapter(...)` — mapping the `AdapterClassName` literals
(`SQLite3Adapter` / `PostgreSQLAdapter` / `Mysql2Adapter` / `TrilogyAdapter`)
through `ADAPTER_CLASS` to the same `GateAdapter` values, with the same polarity
rules — would let ported tests use the Rails-named helper everywhere.

Note `currentAdapter` is variadic (`currentAdapter("Mysql2Adapter",
"TrilogyAdapter", "SQLite3Adapter")`), unlike the single-term `adapterType`
match, so the extractor needs to union the literals.

## Acceptance criteria

- [ ] `scripts/test-compare/gates.ts` resolves `currentAdapter(...)` in a
      `skipIf` / `runIf` expression to the same adapter sets it derives from
      `adapterType`, including the variadic and negated forms.
- [ ] Coverage added in `scripts/test-compare/extract-ts-gates.test.ts`.
- [ ] The four gates in
      `packages/activerecord/src/migration/change-schema.test.ts` can be
      rewritten back to `currentAdapter(...)` with 0 gate-mismatch.
- [ ] parity:test gate-mismatch stays at 0 repo-wide.

## Re-verified 2026-08-17 (ready sweep)

`scripts/test-compare/gates.ts` still matches only the `adapterType` idiom;
`currentAdapter(...)` is still unrecognised.
