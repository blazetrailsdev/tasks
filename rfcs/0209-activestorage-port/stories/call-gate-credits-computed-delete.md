---
title: "Credit a computed-key delete expression as Hash#delete in parity:api:calls"
status: ready
updated: 2026-10-30
rfc: "0209-activestorage-port"
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

`packages/activestorage/src/attached/changes/detach-many.ts` ports `record.attachment_changes.delete(name)` (`vendor/rails/v8.0.2/activestorage/lib/active_storage/attached/changes/detach_many.rb:12`) as `delete this.record.attachmentChanges[this.name]`, the form `ruby-compat-native-required` requires, and `parity:api:calls` still reports `delete` omitted, although `scripts/api-compare/extract-ts-api.ts:7762` describes the expression.

## Acceptance criteria

- `parity:api:calls` credits a `delete` expression with a computed key as Ruby's `Hash#delete`.
- The `@missingRailsCall delete` receipt on `DetachMany#detach` is removed.
