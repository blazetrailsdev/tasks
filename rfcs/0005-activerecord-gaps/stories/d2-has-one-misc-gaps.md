---
title: "has_one misc feature-gap singles"
status: done
updated: 2026-07-11
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4829
claim: "2026-07-09T12:29:35Z"
assignee: "d2-has-one-misc-gaps"
blocked-by: null
closed-reason: null
---

## Context

Split from `d2-has-one-remaining-gaps`. Remaining misc has_one singles in
`packages/activerecord/src/associations/has-one-associations.test.ts`, each
gated on an independent feature gap:

- `nullification on destroyed association` — AuditLog model not ported
  (vendor/rails/activerecord/test/models/auto_id.rb / audit_log).
- `restrict with error with locale` — needs I18n backend translation lookup.
- `reload association with query cache` — needs connection query cache
  (`enable_query_cache!`).
- `assignment before child saved` — has_one writer must persist the child
  immediately on assignment to a saved owner; trails defers persistence to the
  owner's save (JS property setter cannot await).
- `clearing an association clears the associations inverse` — `post.update({
author: null })` must nullify the belongs_to FK (belongs_to update nullify
  gap).

## Acceptance criteria

- [ ] Each single implemented (or re-split) and its test un-skipped with the
      verbatim Rails name; test:compare delta non-negative.
