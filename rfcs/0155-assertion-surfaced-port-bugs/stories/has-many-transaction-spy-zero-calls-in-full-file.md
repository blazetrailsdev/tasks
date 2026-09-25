---
title: "Comment.transaction spy records 0 calls for association proxy transaction inside has_many test file"
status: in-progress
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#8070
claim: "2026-09-25T00:24:15Z"
assignee: "time-weekday-helpers-return-instant-not-time"
blocked-by: null
closed-reason: null
---

## Context

In has-many-associations.test.ts, `vi.spyOn(Comment, "transaction")` then `post.comments.transaction(async () => {})` records 0 calls when run inside the full file, but 1 call in an isolated file (Relation delegation `transaction` at packages/activerecord/src/relation/delegation.ts:452 calls `this.model.transaction`). Rails test: has_many_associations_test.rb:2506 `test_association_proxy_transaction_method_starts_transaction_in_association_class` (`assert_called(Comment, :transaction)`). Likely cross-test pollution of Comment (re-registration or unrestored spy). Blocks converging that test.

## Acceptance criteria

- Root cause identified; the test asserts the spy call like Rails and passes in the full file.
