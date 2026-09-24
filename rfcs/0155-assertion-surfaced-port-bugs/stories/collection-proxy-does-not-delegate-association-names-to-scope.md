---
title: "collection-proxy-does-not-delegate-association-names-to-scope"
status: done
updated: 2026-09-24
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8046
claim: "2026-09-24T18:14:09Z"
assignee: "attribute-assignment-argument-error-names-js-number-not-integer"
blocked-by: null
closed-reason: null
---

## Context

`has_many_through_associations_test.rb` `test_merge_join_association_with_has_many_through_association_proxy` calls `author.comments.ratings.to_sql`. In trails `(author.comments).ratings` is `undefined` — `packages/activerecord/src/associations/collection-proxy.ts` does not delegate the association name to the scope the way Rails' relation delegation does (`activerecord/lib/active_record/relation/delegation.rb` `method_missing`).

`packages/activerecord/src/associations/has-many-through-associations.test.ts` carries the parked `it.skip` test(s) pointing at this story.

## Acceptance criteria

- `author.comments.ratings` returns the merged relation and `.toSql()` does not raise.
- The skipped test(s) are un-skipped and pass.
