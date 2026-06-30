---
title: "enum-db-default-on-new"
status: ready
updated: 2026-06-30
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced converging `enum.test.ts` (PR #4318). `new Book()` does not seed the
schema/column default for enum columns, so `new Book().proposed?` is false where
Rails expects the DB default. Related to the parked RFC 0030 schema-default-on-
new work (see memory `project_schema_cache_warming_converges_partial_decl`).

## Acceptance criteria

Seed enum/column DB defaults on `new` (or via warm schema cache) and port these
`enum_test.rb` cases in `enum.test.ts`:

- uses default value from database on initialization
- uses default value from database on initialization when using custom mapping
