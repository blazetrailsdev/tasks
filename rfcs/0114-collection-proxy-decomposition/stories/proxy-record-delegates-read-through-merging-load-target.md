---
title: "to: :records delegates on a proxy with built-but-unsaved records must merge via load_target, not requery"
status: closed
updated: 2026-08-21
rfc: "0114-collection-proxy-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Stale: the one genuine convergence it named (wrapCollectionProxy's async delegate reading through load_target) landed in PR #6773; the stated defect does not reproduce on main and criterion 1 is unsatisfiable (no test can fail on baseline), per the recorded blocker."
---

## Context

Found while landing PR #6759 (`retire-collection-proxy-enumerable-block`).

`wrapCollectionProxy`'s `get` trap
(`packages/activerecord/src/associations.ts`) picks the synchronous
record-delegate path only when `target.loaded` is true:

```ts
if (target.loaded) {
  const recordDelegate = delegateRecordMethodSync(prop, () => target.target);
  ...
  const arrayDelegate = delegateArrayMethod(prop, () => target.target);
```

otherwise it falls through to `delegateEnumerableMethod(prop, () => target.load())`,
which returns a Promise.

A proxy that has had records _built_ through it — `post.people.build({...})` —
holds them in `_target` while `_targetLoaded` stays false. So `.map` on such a
proxy returns a Promise whose resolution comes from a fresh query that does not
see the unsaved rows, instead of reading the in-memory records.

Rails has no such split. `CollectionProxy#records` is `load_target`
(`vendor/rails/activerecord/lib/active_record/associations/collection_proxy.rb:1024-1026`),
and `CollectionAssociation#load_target`
(`.../collection_association.rb:270-278`) merges rather than replaces:

```ruby
def load_target
  if find_target?
    @target = merge_target_lists(find_target, target)
  end
  loaded!
  target
end
```

`merge_target_lists` (`.../collection_association.rb:334-348`) keeps the
in-memory records, so a built-but-unsaved record survives the load and every
`to: :records` delegate sees it.

trails already has the merge — `CollectionProxy._mergeTargetLists` /
`_refreshUnchangedAttributes` in `associations/collection-proxy.ts` — so the
gap is only in which path the wrapper picks, and whether the async path routes
through the merging loader.

PR #6759 worked around this at two call sites by adding `await`:
`associations/has-many-through-associations.test.ts`, tests `concat` and
`associate new by building`. Rails' bodies (`test_concat`,
`test_associate_new_by_building` in
`vendor/rails/activerecord/test/cases/associations/has_many_through_associations_test.rb`)
have no such await, so those two `await`s are the visible symptom and should
come back out when this converges.

## Converged shape

Reading a delegated `to: :records` method on a proxy resolves through the
`load_target` seam, which merges `find_target` with the existing in-memory
target. A proxy holding built-but-unsaved records answers with those records
included, whether or not `_targetLoaded` is set — matching
`collection_association.rb:270-278`.

## Acceptance criteria

- [ ] A `to: :records` delegate on a proxy carrying built-but-unsaved records
      reports them (regression test that FAILS on baseline).
- [ ] The two `await`s added to `has-many-through-associations.test.ts` by
      #6759 are removed, matching the Rails test bodies. No test renamed.
- [ ] `pnpm parity:api:calls` / `:args` add zero rows for any touched file.
- [ ] `associations/` suite green on SQLite, PostgreSQL and MySQL/MariaDB.
