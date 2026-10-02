---
title: "tooling: option-keys unions same-named bodies in a file on both sides, masking per-owner findings"
status: draft
updated: 2026-10-02
rfc: "0179-api-compare-crediting-rules"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The option-key axis pairs a Ruby method with its TS counterpart by (file, name), not by owner. On the
TS side every candidate recorded under a name in the file is unioned — both the options-type keys and
the body reads (`matchOptionKeysAgainst`, `scripts/api-compare/options-keys.ts`; the maps are
`optionKeysByFileName` / `optionReadsByFileName` in `scripts/api-compare/compare.ts`). Since trails#8420
the Ruby side is unioned the same way (`rubyOptionKeysByName`, `compare.ts`), where it used to take the
first same-named body it saw.

A union on either side can hide a finding when two unrelated classes in one file share a method name:

- TS union: class `A#foo`'s type lacks `:x`, class `B#foo`'s declares it, so `A`'s `missingInTs` is masked.
- Ruby union: TS `A#foo` reads an invented `y`, Ruby `B#foo` reads `:y`, so `A`'s `extraInTs` is masked.

The Ruby union cannot mask a `missingInTs` (it only adds Ruby keys), and keying only one side by owner
manufactures false rows, so both sides have to move together. `compare.ts` already carries the pattern:
`paramsByFileOwnerNameInPkg` keys TS params by `${owner}#${name}`, and `checkArity` receives the Ruby
owner as `rubyModule`.

Files where it matters today: `connection_adapters/abstract/schema_definitions.rb` (three
`defined_for?` bodies: `ForeignKeyDefinition`, `CheckConstraintDefinition`, `IndexDefinition`) and
`migration/compatibility.rb` (the `V*` classes' `change_column` / `add_timestamps` / `add_column`).

## Acceptance criteria

- [ ] Ruby option keys and TS option keys / reads are keyed by (owner, name), and `checkOptionKeys` compares the pair for the owner `checkArity` is called with, falling back to the per-name union only where no owner-level TS candidate exists (the mixin `static x = x` re-export).
- [ ] A unit test covers two same-named methods on different classes in one file, one with a missing key and one with an invented read, and both are reported.
- [ ] Before/after counts for `options-key-mismatches.json` are recorded in the PR body; any new activerecord row is converged or filed in `0174-activerecord-api-parity-100`.

## Verification

```bash
pnpm vitest run scripts/api-compare scripts/parity
```
