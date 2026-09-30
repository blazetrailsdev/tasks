---
title: "tooling: option-keys' extra-in-TS arm reads the options TYPE, so 43 activerecord pairs are noise"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: tooling
packages: ["activerecord"]
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

`options-key-mismatches.json` reports **46** activerecord pairs, 43 of them `extraInTs` only — e.g.
`timestamps`, `new_column_definition`, `add_column_for_alter` each "extra" the whole
`after/array/as/autoIncrement/charset/…` list. Those are the keys of the shared `ColumnOptions` type the
TS parameter is declared with, not keys the body branches on; Rails passes `**options` straight through.
The axis cannot reach zero honestly until it measures keys the body _reads_
(`scripts/api-compare/options-keys.ts`).

## Acceptance criteria

- [ ] `options-keys.ts` collects TS keys from the body's reads (destructuring, `options.x`, `fetch`/`hasKey` calls), not from the declared parameter type, with unit tests over a `**options` pass-through.
- [ ] After the fix, every remaining activerecord `extraInTs` pair is a real invented arm; each is converged here or filed as its own story in this RFC.
- [ ] Report counts for activerecord, activemodel and arel are recorded before/after in the PR body.
