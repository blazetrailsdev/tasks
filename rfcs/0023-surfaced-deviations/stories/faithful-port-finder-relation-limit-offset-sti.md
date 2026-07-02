---
title: "faithful-port-finder-relation-limit-offset-sti"
status: ready
updated: 2026-07-02
rfc: "0023-surfaced-deviations"
cluster: null
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

Follow-up to faithful-port-finder-test-synthetic-clusters. That PR faithfully
ported the Topic ordinal/last cluster (fourth/fifth/\*-to-last/last-bang +
take/first/last-with-integer + irreversible-order) onto canonical Topic +
topics fixtures, but deferred two tests that ride a different fixture set:

- `test_last_on_relation_with_limit_and_offset`
- `test_first_on_relation_with_limit_and_offset`

Both use `posts("sti_comments").comments.order(id: :asc)` — the canonical
posts -> comments STI chain (posts.yml `sti_comments` id=4 with 5 comments) —
and exercise `.limit(n).last(k)` / `.offset(n).first(k)` parity against
`.to_a.last(k)` / `.to_a.first(k)`. They remain as thin synthetic `class Topic`
stubs in packages/activerecord/src/finder.test.ts (block 2).

Rails source: vendor/rails/activerecord/test/cases/finder_test.rb:1055-1085.

## Acceptance criteria

- [ ] Port both tests onto canonical Post + Comment models and posts/comments
      fixtures (`fixtures(["posts","comments"])`), riding `posts("sti_comments")`.
- [ ] Replace the two synthetic `class Topic` stubs of the same name in
      finder.test.ts; test names match Rails verbatim.
- [ ] require-canonical-schema stays clean; no bespoke schema.
