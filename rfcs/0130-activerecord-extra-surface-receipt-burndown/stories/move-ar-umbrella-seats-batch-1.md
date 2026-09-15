---
title: "Move ActiveRecord umbrella seats off Base, batch 1: connection and query core"
status: in-progress
updated: 2026-09-15
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps:
  - converge-active-record-umbrella-onto-the-module
deps-rfc: []
est-loc: 350
priority: null
pr: trails#7772
claim: "2026-09-15T01:58:09Z"
assignee: "move-ar-umbrella-seats-batch-1"
blocked-by: null
closed-reason: null
---

## Context

Step 2 of six, after `converge-active-record-umbrella-onto-the-module` stands up
`packages/activerecord/src/active-record.ts`. That story moved `active_record.rb`'s 12 `def self.` methods;
this one moves the first batch of its 35 `singleton_class.attr_*` config seats off `ActiveRecord::Base`.

The 35 seats are currently `static` accessor pairs in `packages/activerecord/src/base.ts`, credited to
`base.rb` by `umbrella_base_redirect` (`scripts/api-compare/extract-ruby-api.rb:1247`), which flattens
umbrella config onto `<Module>::Base`. They belong on the `ActiveRecord` module, where Rails declares them.
338 reader call sites exist across `packages/**`, which is why the move is batched: the whole set in one PR is
several times any LOC ceiling.

**This batch — the connection and query core, 131 readers:**

| seat                                                              | `active_record.rb` | readers |
| ----------------------------------------------------------------- | ------------------ | ------- |
| `default_timezone` (`attr_reader` + `def self.default_timezone=`) | `:214-218`         | 61      |
| `query_transformers`                                              | `:431`             | 28      |
| `async_query_executor`                                            | `:283`             | 19      |
| `writing_role`                                                    | `:265`             | 13      |
| `reading_role`                                                    | `:268`             | 10      |

`query_transformers` and `async_query_executor` are two of the five guarded reads (see below).
`default_timezone` and `db_warnings_action` have a bare `attr_reader` plus a validating `def self.` writer;
the writer half moved in step 1, so this batch moves only the reader half and reunites the pair on the module.

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
