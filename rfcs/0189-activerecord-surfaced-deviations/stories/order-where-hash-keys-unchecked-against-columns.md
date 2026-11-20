---
title: "order/where hash keys are not type-checked against the model's columns"
status: draft
updated: 2026-11-20
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: ["activerecord", "activerecord-cli"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Relation#order` and `#where` take a hash keyed by column name (`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/query_methods.rb`, `order` / `preprocess_order_args`, `where` / `build_where_clause`), and trails-tsc already knows each model's columns from `db/schema.ts`: `note.createdAt` fails with "Property 'createdAt' does not exist on type 'Note'. Did you mean 'created_at'?". The hash arguments are not checked against them, so `notebook.notes.order({ pinned: "desc", createdAt: "desc" })` (`examples/react-native-notes/App.tsx`, trails#10425) typechecks. On SQLite with double-quoted string literals enabled, `"notes"."createdAt"`-style unknown identifiers can be read as string constants, so the second sort key silently did nothing on the device.

## Acceptance criteria

- trails-tsc types the hash form of `order` and `where` (on the model class, `Relation<T>` and association proxies) so a key that is not a column or attribute of `T` is a type error, while string / Arel / SQL-fragment arguments keep their current types.
- A dx-test pins `order({ createdAt: "desc" })` as an error and `order({ created_at: "desc" })` as accepted for a schema with `created_at`.
