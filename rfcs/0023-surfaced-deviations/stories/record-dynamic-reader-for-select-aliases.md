---
title: "Loaded records expose no dynamic reader for select aliases (record.post_count undefined)"
status: ready
updated: 2026-07-05
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Trails model instances expose no dynamic reader for select aliases: after
`Comment.group("type").select("COUNT(post_id) AS post_count, type")`, a loaded
record has `post_count` in its attributes hash but `record.post_count` is
undefined (only `record.readAttribute("post_count")` works). Rails exposes it via
attribute-method / method_missing so `relation.map(&:post_count)` works
(vendor/rails/activerecord/test/cases/relations_test.rb:228-249). Surfaced in
PR #4631, where the un-skipped from-alias group tests had to use
`readAttribute("post_count")` instead of `record.post_count`.

## Acceptance criteria

- A loaded record reads a non-column select alias via property access
  (`record.post_count`), matching Rails' `&:post_count`.
- Update the three from-alias group/select tests in relations.test.ts to use
  the dotted accessor once available.
