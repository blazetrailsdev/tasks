---
title: "update([dup ids]) shares one instance vs Rails' distinct objects"
status: in-progress
updated: 2026-06-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: 40
pr: 3952
claim: "2026-06-23T02:11:17Z"
assignee: "update-duplicated-ids-shared-instance"
blocked-by: null
---

## Context

`Base.update([ids], [attrs])` (`packages/activerecord/src/base.ts`, ~line 505-523)
batches the lookup into a single `find(uniqueIds)` then reorders by id via a
`byKey` map. PR #3841 added id-dedup so `update([1, 1, 2], …)` works (our batched
`find` rejects duplicate ids).

Divergence: Rails' `update` does `id.map { find }.each_with_index` — for a
duplicated id it returns **two distinct in-memory instances** of the same row.
trails reuses the **same** instance for the duplicate (updated twice in
sequence). The DB end-state and `map(&:id) == [1, 1, 2]` match Rails, but object
identity differs. Acknowledged in PR #3841 review as DB-equivalent.

Rails source: `activerecord/lib/active_record/persistence.rb` (`update` class
method). Test: `persistence_test.rb:128` `test_update_many_with_duplicated_ids`.

## Acceptance criteria

- [ ] Decide converge-or-document: ideally `update([1,1,2], …)` returns distinct
      instances per requested id (re-find/dup per occurrence) to match Rails
      object identity, OR document this as a ratified, DB-equivalent divergence
      with rationale if convergence is not worthwhile.
- [ ] If converging, no regression in the existing parallel-update tests
      (persistence.test.ts `update many with duplicated ids` and the
      `update with parallel ids + attrs arrays` test).
