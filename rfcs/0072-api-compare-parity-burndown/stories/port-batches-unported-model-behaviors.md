---
title: "port-batches-unported-model-behaviors"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6102
claim: "2026-08-04T21:23:01Z"
assignee: "i18n-date-parse-extract-valid-date-frags-p"
blocked-by: null
closed-reason: null
---

## Context

Found while doing `converge-relation-subfile-model-accessor-reads` (#5325).
Three `relation/batches.ts` bodies carry wide-ratchet `model` entries, but
unlike the rest of that story the cause is NOT an accessor bypass — there is
no `_modelClass` read to reroute. The surrounding Rails BEHAVIOR is unported,
so the `model` call is missing along with the logic that makes it. These are
functional gaps, not call-graph noise.

### 1. `ensure_valid_options_for_batching!`

(vendor/rails/activerecord/lib/active_record/relation/batches.rb:305-326)
Rails validates that the cursor covers a unique key:

       if (Array(primary_key) - cursor).any?
         indexes = model.schema_cache.indexes(table_name)
         unique_index = indexes.find { |index| index.unique && index.where.nil? && (Array(index.columns) - cursor).empty? }
         unless unique_index
           raise ArgumentError, ":cursor must include a primary key or other unique column(s)"
         end
       end

trails (`packages/activerecord/src/relation/batches.ts:16-40`) checks only
start/finish arity and the `:order` values — a non-unique `:cursor` is
silently accepted, so batching can loop or skip rows instead of raising.

### 2. `act_on_ignored_order`

batches.rb:369-377 — Rails falls back to a warning when not raising:

       elsif model.logger
         model.logger.warn(ORDER_IGNORE_MESSAGE)

trails (batches.ts:122-127) raises or silently does nothing; the warn arm
is absent.

### 3. `batch_on_unloaded_relation`

batches.rb:426-432 — Rails computes

       empty_scope = to_sql == model.unscoped.all.to_sql

and uses it to gate the `use_ranges` fast path. trails
(batches.ts:193-237) has no `empty_scope` notion, so the range-based
batching branch Rails takes for an unscoped relation is never selected.

Rails' own tests for these live in
`vendor/rails/activerecord/test/cases/batches_test.rb` — port the existing
test names verbatim rather than inventing new ones.

## Acceptance criteria

- Port the unique-index guard in `ensure_valid_options_for_batching!`,
  including the `ArgumentError` message verbatim, sourcing indexes through the
  schema cache the way Rails does.
- Port the `model.logger.warn` arm of `act_on_ignored_order`.
- Port `empty_scope` and its `use_ranges` gating in
  `batch_on_unloaded_relation`.
- Cover each with the corresponding Rails test from `batches_test.rb`, names
  matching Rails verbatim; each must FAIL on baseline.
- Reseed with `pnpm parity:api:calls:reseed`; the three `model` entries (plus
  the `logger` / `unscoped` / `primary_key` entries in the same bodies) should
  drop out. `pnpm parity:api:calls` stays green and the baseline does not grow.
- 500 LOC ceiling — the three items are independent; if the port plus tests
  exceeds it, ship one and register the rest as follow-up stories rather than
  fanning out PRs.

Hard rules: no `node:*` imports; no `process.*`; async fs only; no new
third-party runtime deps; no stacked PRs; canonical schema and fixtures only.
