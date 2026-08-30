---
title: "param-drift-activerecord-final-four-residual-rows"
status: ready
updated: 2026-08-30
rfc: "0128-parameter-name-drift-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`param-drift-enrol-activerecord`'s acceptance criterion is a 0-row
`parity:api --package activerecord --params` run. Measured on `origin/main`
@ f1ef395e8 (after a full `pnpm build`, `API_COMPARE_FORCE=1`), activerecord
sits at **2472/2478 pairs — 6 rows**. Two of those six are already owned by
`param-drift-activerecord-middleware-call-takes-env`
(`middleware/database_selector.rb` and `middleware/shard_selector.rb`, both
`call(env)` ported as `call(request)`).

This story is the other four, filed rather than absorbed into the mark exactly
as the enrolment story's criterion directs. Verbatim from
`scripts/api-compare/output/param-name-mismatches.json`:

| Ruby file                 | Ruby method    | pos | Ruby param   | TS param          |
| ------------------------- | -------------- | --- | ------------ | ----------------- |
| `autosave_association.rb` | `reload`       | 0   | `options`    | `inheritedReload` |
| `core.rb`                 | `initialize`   | 0   | `attributes` | `value`           |
| `insert_all.rb`           | `quote_column` | 0   | `column`     | `name`            |
| `type.rb`                 | `lookup`       | 0   | `args`       | `lookupKey`       |

Notes from a first read, so the next agent does not re-derive them:

- `insert_all.rb` is a plain rename. Rails
  `activerecord/lib/active_record/insert_all.rb` spells `quote_column(column)`;
  `packages/activerecord/src/insert-all.ts:482` spells `quoteColumn(name)`,
  with seven call sites in the same file.
- `type.rb:41` is `def lookup(*args, adapter: current_adapter_name, **kwargs)`
  — an anonymous splat, so position 0 is `args`;
  `packages/activerecord/src/type.ts:110` takes a single `symbol`/`lookupKey`.
  Same class as `param-drift-column-constructors-anonymous-splat`; check how
  that story settled the splat spelling before inventing a new one.
- `autosave_association.rb`'s `reload` is ported at
  `packages/activerecord/src/autosave-association.ts:41` as a wrapper taking the
  inherited implementation (`reload(inheritedReload)`) and forwarding `options`
  inside — the mixin-layer shape, so this is likely the same convergence class
  as `param-drift-create-record-mixin-layers-and-inlined-partial-inserts`
  rather than a rename.
- The `core.rb` `initialize` row is scored against a TS `constructor`, but
  `packages/activerecord/src/core.ts` declares no class — it is a nested/scored
  constructor match of the kind RFC 0126's nested-namespace walking surfaced.
  Confirm what the comparer is pairing before renaming anything.

## Acceptance criteria

- All four rows above are gone from
  `API_COMPARE_FORCE=1 pnpm parity:api --package activerecord --params`.
- Each fix is a convergence onto the Rails identifier (or, for the two shape
  rows, onto Rails' actual parameter list) — no baseline row, no widened skip.
- Together with `param-drift-activerecord-middleware-call-takes-env`, this
  brings activerecord to 0 rows and unblocks `param-drift-enrol-activerecord`.
