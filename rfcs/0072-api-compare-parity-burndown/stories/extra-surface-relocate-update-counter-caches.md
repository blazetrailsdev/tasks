---
title: "extra-surface: relocate updateCounterCaches to Builder::BelongsTo/CounterCache"
status: ready
updated: 2026-07-26
rfc: "0072-api-compare-parity-burndown"
cluster: extra-surface
deps: ["extra-surface-associations-engine-classify"]
deps-rfc: []
est-loc: 150
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`updateCounterCaches` (`associations.ts:3501`, ~147 LOC) applies counter-cache
deltas on create/destroy. Rails splits this across
`Builder::BelongsTo.add_counter_cache_callbacks`
(`vendor/rails/activerecord/lib/active_record/associations/builder/belongs_to.rb:27`)
and `CounterCache` (`counter_cache.rb`, `update_counters` /
`increment_counter` / `decrement_counter`).

Target TS files: `packages/activerecord/src/associations/builder/belongs-to.ts`
(which already imports it) and/or `packages/activerecord/src/counter-cache.ts`,
renamed to the Rails method the body actually implements.

Also inside this range is the private helper
`destroyedByAssociationForeignKey`, which derives the FK from a
`destroyed_by_association` reflection — that is Rails' inline logic in
`counter_cache.rb`; move or inline it alongside.

`updateCounterCaches` is re-exported from `index.ts:61` and imported by
`base.ts` — update both.

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
