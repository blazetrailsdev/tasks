---
title: "move-ar-umbrella-seats-batch-3"
status: draft
updated: 2026-09-14
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Step 4 of six, and the last seat batch. Same shape as `move-ar-umbrella-seats-batch-1`: moves the remaining
`singleton_class.attr_*` seats of `active_record.rb` off `ActiveRecord::Base` onto the `ActiveRecord` module
in `packages/activerecord/src/active-record.ts`.

**This batch — the remainder, 107 readers:**

| seat                                               | `active_record.rb` | readers |
| -------------------------------------------------- | ------------------ | ------- |
| `db_warnings_ignore`                               | `:262`             | 11      |
| `permanent_connection_checkout` (`attr_reader`)    | `:311`             | 10      |
| `db_warnings_action` (`attr_reader`)               | `:233`             | 9       |
| `protocol_adapters`                                | `:490`             | 9       |
| `belongs_to_required_validates_foreign_key`        | `:345`             | 9       |
| `application_record_class`                         | `:354`             | 9       |
| `raise_on_assign_to_attr_readonly`                 | `:342`             | 8       |
| `raise_int_wider_than_64bit`                       | `:446`             | 8       |
| `action_on_strict_loading_violation`               | `:361`             | 7       |
| `use_yaml_unsafe_load`                             | `:438`             | 6       |
| `queues`                                           | `:336`             | 5       |
| `generate_secure_token_on`                         | `:460`             | 5       |
| `before_committed_on_all_records`                  | `:348`             | 5       |
| `run_after_transaction_callbacks_in_order_defined` | `:351`             | 4       |
| `yaml_column_permitted_classes`                    | `:453`             | 2       |

`db_warnings_action` and `permanent_connection_checkout` are bare `attr_reader`s whose validating
`def self.` writers (`:235`, `:314`) moved in step 1; this batch reunites each pair on the module.

`db_warnings_ignore` is the worked example for the whole campaign in reverse — PR #7428 moved it
_into_ `base.ts` from `ar-config.ts` under the flattening rule. Moving it on to the module now is not undoing
that PR; it is finishing the direction it started.

After this batch every one of the 35 seats except `ar-config.ts`'s two lives on the module, and `base.ts`
holds none of them.

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
