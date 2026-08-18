---
title: "Scoped skip suppresses build_count_subquery, which is already extracted at the Rails name"
status: draft
updated: 2026-08-18
rfc: "0110-parity-skip-register-correctness"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`SCOPED_SKIP_GROUPS` in `scripts/parity/conventions.ts` carries:

```ts
{
  reason:
    "Calculations#build_count_subquery is realized inline inside trails' " +
    "performCount (calculations.ts) — the limit/offset count path builds the " +
    "subquery there rather than as a separate named method.",
  names: ["build_count_subquery"],
  rubyFiles: ["relation.rb", "relation/calculations.rb"],
}
```

That reason is not true of the current tree.
`packages/activerecord/src/relation/calculations.ts:1298` declares:

```ts
/**
 * Mirrors: ActiveRecord::Calculations#build_count_subquery
 * (calculations.rb:662-678).
 * @internal
 */
function buildCountSubquery(
```

called from the count path at `:1343`, with `isBuildCountSubquery` porting the
`build_count_subquery?` predicate (`calculations.rb:655-660`) alongside it. The
helper is extracted, at the Rails name, citing the Rails lines — exactly what
CLAUDE.md's decomposition rule asks for.

Because the entry lists **both** `relation.rb` and `relation/calculations.rb`,
the method is suppressed even at its true home seat, so a ported method is
dropped from the `parity:api` denominator rather than credited.

Rails: `vendor/rails/activerecord/lib/active_record/relation/calculations.rb:655-678`.
trails: `packages/activerecord/src/relation/calculations.ts:1298,1343`.

Note `buildCountSubquery` is module-private and Rails' is a private method, so
whether it pairs cleanly may depend on the privates comparator
(`api_compare_privates_stats`). Establishing that is part of the work.

## Acceptance criteria

1. The `build_count_subquery` entry is deleted from `SCOPED_SKIP_GROUPS`, or
   narrowed to `relation.rb` alone if the `relation.rb` seat genuinely
   double-counts the method (state which, with the measurement).
2. `parity:api` pairs `build_count_subquery` against `buildCountSubquery` at
   the `relation/calculations.rb` seat — shown by a before/after run, not
   asserted.
3. The PR states the `parity:api` delta. The expected shape is denominator +1
   and `matched` +1 for this member; if `matched` does not move, the pairing
   did not happen and criterion 2 is unmet.
4. No new baseline row and no replacement skip entry are added.
