---
title: "Model.find([]) should return [] not raise RecordNotFound"
status: ready
updated: 2026-06-22
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

While porting `Relation#exec_main_query`'s contradiction short-circuit
(PR #3883), the existing test `relations.test.ts:1917` ("find in empty array")
was found to diverge from Rails. It asserts `Item.find([])` _rejects_ with
`RecordNotFound`:

    it("find in empty array", async () => {
      await expect(Item.find([])).rejects.toThrow(RecordNotFound);
    });

But Rails `ActiveRecord::FinderMethods#find` with an array argument returns an
array, and an empty array returns `[]` with no error:

    # activerecord/lib/active_record/relation/finder_methods.rb (find_with_ids)
    # ids == [] → returns []

So `Model.find([])` should resolve to `[]`, not raise. The trails test name
also collides with Rails' `test_find_in_empty_array` (relations_test.rb), which
is actually `Author.all.where(id: []).to_a` being blank — a different test that
PR #3883 ported correctly on the canonical schema in a separate file.

## Acceptance criteria

- [ ] `Model.find([])` returns `[]` (no `RecordNotFound`), matching Rails
      `find_with_ids` empty-array behavior.
- [ ] Reconcile the bespoke `relations.test.ts:1917` "find in empty array"
      test: either correct its body to match the Rails method of that name, or
      converge it to the canonical schema (the file is grandfathered in
      `require-canonical-schema-exclude.json`).
- [ ] Verify `find` with empty array against Rails finder_methods test coverage.
