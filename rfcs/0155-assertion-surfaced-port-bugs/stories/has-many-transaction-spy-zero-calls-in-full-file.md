---
title: "Comment.transaction spy records 0 calls for association proxy transaction inside has_many test file"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

In has-many-associations.test.ts, `vi.spyOn(Comment, "transaction")` then `post.comments.transaction(async () => {})` records 0 calls when run inside the full file, but 1 call in an isolated file (Relation delegation `transaction` at packages/activerecord/src/relation/delegation.ts:452 calls `this.model.transaction`). Rails test: has_many_associations_test.rb:2506 `test_association_proxy_transaction_method_starts_transaction_in_association_class` (`assert_called(Comment, :transaction)`). Likely cross-test pollution of Comment (re-registration or unrestored spy). Blocks converging that test.

## Acceptance criteria

- Root cause identified; the test asserts the spy call like Rails and passes in the full file.
