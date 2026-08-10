---
title: "Converge the 12 order: rows the extractor traversal alignment surfaced"
status: done
updated: 2026-08-07
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: 6206
claim: "2026-08-07T21:52:41Z"
assignee: "converge-count-onto-calculate-perform-calculation"
blocked-by: null
closed-reason: null
---

## Context

`align-chained-call-ref-order-across-extractors` (PR #6193) flipped both
call-skeleton extractors to emit a chained call's receiver before the call it
receives, retiring 42 `order:` rows that were pure extractor skew.

`reorderedCalls` (`scripts/api-compare/compare.ts:368`) flags **at most one
inversion per body** — "the first one" — so retiring a body's skew row exposed
whatever inversion sat behind it. 12 such rows were added to the baseline in
that PR, each with the reason "ORDER-only divergence surfaced when the two
extractors' chained-call traversal was aligned". Unlike the rows they replaced,
these are **real**: the port genuinely calls Rails' collaborators in a different
sequence.

The rows, by shard under `scripts/api-compare/call-mismatches-exclude/`:

- `activerecord/associations/belongs-to-association.json` —
  `update_counters_via_scope`, `order:reflection,primaryKey`
- `activerecord/connection-adapters/postgresql/schema-creation.json` —
  `visit_AlterTable`, `order:visitAddExclusionConstraint,join`
- `activerecord/reflection.json` — `create`, `order:constructor,reflectionClassFor`
- `activerecord/relation/batches.json` — `batch_on_unloaded_relation`,
  `order:applyLimits,limit`
- `activerecord/relation/finder-methods.json` — `find_some_ordered`,
  `order:model,primaryKey`
- `activerecord/relation/merger.json` — `merge_preloads`,
  `order:preloadBang,reflectOnAllAssociations`
- `activerecord/relation/query-methods.json` — `preprocess_order_args`,
  `order:disallowRawSqlBang,model`
- `activerecord/signed-id.json` — `signed_id`, `order:id,generate`
- `activerecord/token-for.json` — `generates_token_for`,
  `order:constructor,tokenDefinitions`
- `activesupport/messages/rotation-coordinator.json` — `build_with_rotations`,
  `order:uniq,normalizeOptions`
- `i18n/backend/base.json` — `load_file`, `order:tr,extname`

Read the row as `order:b,a → a,b` = "TS calls `b` before `a`; Rails calls `a`
before `b`" (`compare.ts:364-367`).

## Converged shape

For each body, open the Rails method (`pnpm rails:find <ruby_name>` resolves the
`file:line`) and reorder the TS body's statements to match Rails' call order.
Per CLAUDE.md's "Control flow" rule this is almost always a straight fix — the
port reads the same collaborators, just in an order the transcription changed.
Delete each row from its shard by hand as it converges (only-shrink; use
`serializeBaseline`, never `--write`).

Expect a second wave: retiring one body's row can surface that body's _next_
inversion, exactly as this batch was surfaced. That is the ratchet working, not
a regression — converge the newly-surfaced row too rather than baselining it,
unless the reordering is genuinely forced by a TypeScript shortcoming.

## Acceptance criteria

- [ ] Every row listed above is either converged (deleted from its shard) or
      carries a specific, reviewed reason naming the language shortcoming that
      forces the order — not the seeded surfacing reason.
- [ ] `pnpm parity:api:calls` green; the baseline row count strictly decreases.
- [ ] `pnpm parity:api` / `pnpm parity:test` deltas non-negative.
