---
title: "Pin OPERATOR_SPELLING_BY_FQN entries for the 16 module-level operators"
status: done
updated: 2026-08-03
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 5955
claim: "2026-08-03T03:15:48Z"
assignee: "module-level-operator-spellings-unpinned"
blocked-by: null
closed-reason: null
---

## Context

PR #5915 fixed `build-rails-file-structure-manifest.ts`: the standalone-module
branch (Ruby modules that port to top-level `this`-typed functions) never
consulted `operatorSpelling`, so an `OPERATOR_SPELLING_BY_FQN` entry for any
such module was dead. `ActiveRecord::Core#==` / `#<=>` were pinned there as
part of that PR.

Now that the branch resolves spellings, the other 16 module-level operators in
the Ruby API extract are pinnable but still unmapped, so their Rails source
positions stay unenforced by `rails-file-structure-method-order`:

- `Arel::Math` (arel/math.rb): `*`, `+`, `-`, `/`, `&`, `|`, `^`, `<<`
- `ActiveRecord::AttributeMethods` (attribute_methods.rb): `[]`, `[]=`
- `ActiveRecord::Delegation` (relation/delegation.rb): `[]`, `&`, `|`, `+`, `-`
- `ActiveSupport::CompareWithRange` (core_ext/range/compare_range.rb): `===`

Enumerate with a pass over `scripts/api-compare/output/rails-api.json`
`packages.*.modules.*.instanceMethods`.

## Acceptance criteria

- [ ] For each of the four modules above, confirm the TS port's actual spelling
      (or confirm there is no TS member — in which case do NOT add an entry, the
      manifest build FAILS on dead ones) and add the verified entries to
      `OPERATOR_SPELLING_BY_FQN` with the `file:line` comment the table uses.
- [ ] Any module operator with no TS counterpart at all is filed as its own
      port story rather than pinned.
- [ ] `pnpm parity:api` stays green (no dead-entry failure) and
      `rails-file-structure-method-order` reports clean.
