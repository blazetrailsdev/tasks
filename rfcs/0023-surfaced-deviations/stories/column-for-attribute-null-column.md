---
title: "column-for-attribute-null-column"
status: draft
updated: 2026-07-31
rfc: "0023-surfaced-deviations"
cluster: null
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

Found by the prism-codegen conformance scorer triage (PR #5727). Rails
column_for_attribute falls back to ConnectionAdapters::NullColumn.new(name)
(vendor/rails/activerecord/lib/active_record/model_schema.rb:463-468); the
port returns a bare { name, null: true, type: null } literal
(packages/activerecord/src/model-schema.ts:805-809). Class identity and the
rest of the NullColumn surface differ; Rails tests assert on NullColumn.

## Acceptance criteria

- Port returns a NullColumn instance (ported per Rails layout) from
  columnForAttribute for unknown attributes.
- Rails' column_for_attribute tests for the null case ported/verified.
