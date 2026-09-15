---
title: "Move ActiveRecord umbrella seats off Base, batch 2: schema, migration and adapter boot"
status: done
updated: 2026-09-15
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps:
  - move-ar-umbrella-seats-batch-1
deps-rfc: []
est-loc: 300
priority: null
pr: trails#7778
claim: "2026-09-15T12:27:01Z"
assignee: "move-ar-umbrella-seats-batch-2"
blocked-by: null
closed-reason: null
---

## Context

Step 3 of six. Same shape as `move-ar-umbrella-seats-batch-1`: moves the next batch of
`active_record.rb`'s 35 `singleton_class.attr_*` seats off `ActiveRecord::Base` onto the `ActiveRecord`
module in `packages/activerecord/src/active-record.ts`, which
`converge-active-record-umbrella-onto-the-module` stood up.

**This batch — the schema, migration and adapter-boot seats, 100 readers:**

| seat                               | `active_record.rb` | readers |
| ---------------------------------- | ------------------ | ------- |
| `schema_format`                    | `:372`             | 20      |
| `error_on_ignored_order`           | `:380`             | 11      |
| `database_cli`                     | `:211`             | 10      |
| `lazily_load_schema_cache`         | `:189`             | 10      |
| `timestamped_migrations`           | `:386`             | 9       |
| `validate_migration_timestamps`    | `:394`             | 7       |
| `migration_strategy`               | `:400`             | 6       |
| `dump_schemas`                     | `:419`             | 6       |
| `maintain_test_schema`             | `:339`             | 6       |
| `verify_foreign_keys_for_fixtures` | `:428`             | 5       |
| `dump_schema_after_migration`      | `:409`             | 4       |
| `verbose_query_logs`               | `:329`             | 3       |
| `disable_prepared_statements`      | `:182`             | 3       |

`lazily_load_schema_cache` and `disable_prepared_statements` are two of the five guarded reads (see below).

## Shared shape (all three seat batches)

For each seat: delete its `static get` / `static set` pair and its module-level `_<seat>` storage from
`packages/activerecord/src/base.ts`, declare the accessor pair on the `ActiveRecord` module in
`packages/activerecord/src/active-record.ts` at its `active_record.rb` position, and repoint every reader.
Do not leave a delegating stub on `Base` — a documented deviation is debt, not permission, and a delegator is
a new one.

`umbrella_base_redirect` stays alive through this batch, so a seat that has already moved simply stops being
found on `base.rb` and starts being found on `active_record.rb`; the redirect is deleted in
`retire-umbrella-base-redirect`, which is the last story of the six.

**Guarded reads.** CLAUDE.md § "Call-time constant resolution" lists five reads on a standalone adapter's own
path that are written `_Base?.<seat> ?? <rails default>` rather than `_Base!.<seat>` — `logger`,
`disablePreparedStatements`, `queryTransformers`, `asyncQueryExecutor` and `lazilyLoadSchemaCache`. Four of
those five are umbrella seats and are in scope across these batches. A guarded read stays guarded, against the
new module rather than `base-slot.ts`; the `sqlite-drivers` lane (an adapter constructed and queried with no
model layer loaded) must still pass. Do not silently convert a guarded read to an unguarded one, and do not
add a guard to a read that did not have one.

**Load order.** `active-record.ts` may need its own slot module if a plain import from a reader closes a
cycle. Verify with a plain-node import of the **built** `dist/**.js` modules as entry modules, in both
directions — a vitest run enters the funnel module first and masks the TDZ, so a green suite proves nothing
here.

## Acceptance criteria

- Every seat listed above is an accessor pair on the `ActiveRecord` module in `active-record.ts`, its `Base`
  static pair and backing storage are deleted, and every reader in `packages/**` reads the module.
- No delegating stub is left behind on `Base`.
- Guarded reads stay guarded and the `sqlite-drivers` lane passes.
- `pnpm parity:api` shows `base.rb` not regressing and `active_record.rb` rising; `pnpm parity:api:extra:gate`
  green with no STALE tag; `pnpm parity:api:calls`, `:calls:args`, `:params` clean.
