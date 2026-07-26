---
title: "extra-surface: relocate loadHasMany to HasManyAssociation#findTarget"
status: ready
updated: 2026-07-26
rfc: "0072-api-compare-parity-burndown"
cluster: extra-surface
deps: ["extra-surface-associations-engine-classify"]
deps-rfc: []
est-loc: 225
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`loadHasMany` (`associations.ts:1933`, ~225 LOC) is the has_many target load.
Rails home: `ActiveRecord::Associations::Association#find_target`
(`vendor/rails/activerecord/lib/active_record/associations/association.rb:248`)
via `CollectionAssociation` / `HasManyAssociation`.

Target TS file: `packages/activerecord/src/associations/has-many-association.ts`
(or `collection-association.ts` for the shared portion), renamed to `findTarget`.

Caution: `loadHasMany` currently FUSES relation building with caching, strict
loading, and inverse_of. That fusion is exactly why the `@internal` trails-only
helpers `buildHasManyRelation` (`associations.ts:2450`) and
`buildThroughJoinScope` (`:2445`) had to exist at all — in Rails both are just
`association.scope`. Undoing the fusion as part of this move would let those two
helpers be deleted outright; if that pushes past 500 LOC, register it separately.

`loadHasMany` is re-exported from `index.ts:56` and imported by
`associations/collection-proxy.ts` — update both.

Line numbers are as of the merge of the classification PR (#5341). If they
have drifted, re-derive with
`grep -n '^export \(async \)\?function <name>' packages/activerecord/src/associations.ts`.

### Why relocation alone is not enough

`api:compare` matches a TS name to a Rails method by **name + Rails-layout
file**. Moving a body to `associations/*-association.ts` under its current
trails name only moves the extra; it does not clear it. Each name below must be
**renamed to the Rails method name AND placed in the Rails-layout file**.

None of `findTarget`, `buildRecord`, or `countRecords` exist yet under
`packages/activerecord/src/associations/` — the association classes are thin
shells that delegate INTO the `associations.ts` engine. So the direction is:
the body moves to the association class, and `associations.ts` imports it (or
the call site moves wholesale). Do NOT re-export from `associations.ts` under
the old name — that recreates the extra and adds an import cycle.

Parent classification: story `extra-surface-associations-engine-classify`
(RFC 0072), which classified `associations.ts`'s 26 novel extras into
(a) invention, (b) `@internal`/allowlist, (c) misplaced port. This is a (c).

## Acceptance criteria

- The named function(s) are gone from `packages/activerecord/src/associations.ts`
  and exist under their Rails method name in the Rails-layout TS file named above.
- `pnpm api:compare && pnpm api:extra --package activerecord --novel-only`
  shows the `associations.ts` novel count drop by exactly the number of names in
  this story. Record before/after in the PR body.
- If a name is re-exported from `packages/activerecord/src/index.ts`, drop that
  re-export — Rails does not expose these at the `ActiveRecord::` level.
- Association test files covering the moved behavior pass; no test renames.
- No `node:*` imports. No `process.*` references. Async fs only. camelCase only.
- Under the 500 LOC ceiling. NO stacked PRs — single PR from `main`.

## Fidelity-first policy

Moving toward Rails fidelity is the stated goal of this (and every)
extra-surface story; the allow-set/allowlist is a **last resort**. Before
admitting or keeping any name in the allow-set, first make — or file as its own
story — the fidelity change that would make the entry unnecessary: converge the
TS surface onto the Rails name and Rails-layout file (relocate + rename),
delete the invention, or justify an `@internal` at the declaration site. Only
names that are faithful-but-unmappable (e.g. genuine Ruby file constants or
nested class names present in the matched Rails file) belong in the allow-set;
any other allowlisted entry must cite the filed fidelity story next to it.
