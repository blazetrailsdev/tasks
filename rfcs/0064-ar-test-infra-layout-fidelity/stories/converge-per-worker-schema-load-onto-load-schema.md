---
title: "per-worker schema load bypasses load_schema's adapter-specific arm"
status: ready
updated: 2026-07-28
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails loads the test schema through exactly one entry point:
`LoadSchemaHelper#load_schema`
(`vendor/rails/activerecord/test/support/load_schema_helper.rb:4-21`), which
runs `schema.rb` and then the `<adapter>_specific_schema.rb` arm.

trails has **two** paths, and only one of them is that port:

- `support/load-schema-helper.ts` `loadSchema()` — used by
  `support/template-global-setup.ts` (the sqlite/PG template build) and
  `support/setup-adapter-suite.ts` (adapter-cluster files, on their own
  adapter).
- `test-setup-dy.ts:45-57` — the per-worker DB **every ordinary AR test rides**.
  It generates a schema file from `TEST_SCHEMA` and hands it to
  `DatabaseTasks.reconstructFromSchema` / `DatabaseTasks.loadSchema`, which know
  only about `schema.rb`'s mirror. On the reconstruct path it _purges_ the DB
  first, discarding anything the template carried.

PR #5523 found this the hard way: the `ADAPTER_SPECIFIC_SCHEMAS` arm had been in
place since PR #5400 but had never reached the database tests actually run
against, on any lane. The fix was to split `loadAdapterSpecificSchema` out of
`loadSchema` and call it a second time from `test-setup-dy.ts:76-81` — which
works, but leaves the two-path shape (and so the same class of bug) in place:
any future half of `load_schema` added to one path is silently absent from the
other.

## Acceptance criteria

- The per-worker schema load runs the same `loadSchema` the template build does,
  so `load_schema_helper.rb`'s two arms cannot be applied to one path and not
  the other.
- `test-setup-dy.ts` no longer needs its own `loadAdapterSpecificSchema` call;
  if `DatabaseTasks` must stay in the picture for purge/reconstruct, the
  adapter-specific arm is applied inside that path rather than bolted on after.
- A boot-time assertion (like the existing `accounts`/`topics`/`posts` check at
  `test-setup-dy.ts:59-74`) covers at least one adapter-specific table, so a
  regression fails at worker startup rather than as a confusing per-file
  "relation does not exist".
