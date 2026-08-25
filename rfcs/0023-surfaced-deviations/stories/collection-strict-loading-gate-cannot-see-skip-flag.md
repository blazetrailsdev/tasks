---
title: "Collection strict-loading gate lives in a loader that cannot see @skip_strict_loading"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "merged into strict-loading-check-in-reader-not-find-target — one deviation: the strict-loading gate belongs on Association#find_target (association.rb:247-273, violates_strict_loading? at :284-291) reading @skip_strict_loading (:276-282)"
---

## Context

Rails puts the strict-loading gate on the association instance:
`Association#find_target` calls `violates_strict_loading?`
(`vendor/rails/activerecord/lib/active_record/associations/association.rb:248-251`,
guard at `:284-291`), which reads the instance's `@skip_strict_loading`.
`Association#skip_strict_loading` (`association.rb:276-282`) raises that flag
for the duration of a block.

trails has BOTH: an instance-level `isViolatesStrictLoading()` on
`Association` (`packages/activerecord/src/associations/association.ts`, which
does honor `_skipStrictLoading`) and a second, independent check inside the
_functional_ has_many loader
(`packages/activerecord/src/associations/has-many-association.ts:~550`,
`_violatesStrictLoading(record, options) && _findTargetReachable(...)`). The
functional loader takes the trails-only `(owner, assocName, options)` triple
rather than an association instance, so it cannot see `_skipStrictLoading` — and
the instance-level check is not the one that fires on the collection load path.

PR #5767 hit this porting `concat`'s `skip_strict_loading { load_target }`:
wrapping the call and widening `skipStrictLoading` to `protected` was NOT
enough, because the raise came from the functional loader. The fix threaded the
flag through as a 5th positional parameter
(`has-many-association.ts:169-174` → `:517` → `:550`). That parameter is pure
trails surface with no Rails counterpart, and it only covers the one caller that
remembered to pass it — every other functional-loader entry point still bypasses
`@skip_strict_loading` silently.

Related but distinct from
[[strict-loading-check-in-reader-not-find-target]], which covers the _singular_
side (check in the reader instead of `find_target`). This one is the collection
side: the check exists in a loader that structurally cannot see the association
instance's flag.

## Acceptance criteria

- [ ] The collection strict-loading gate consults the association instance's
      `_skipStrictLoading` without a threaded parameter — either by moving the
      check onto `HasManyAssociation#findTarget` (the Rails-shaped entry point)
      or by giving the functional loader access to the holder.
- [ ] The trails-only `skipStrictLoading` parameter on the functional
      `findTarget` (`has-many-association.ts:517`) is deleted, not merely
      defaulted.
- [ ] `strict-loading.test.ts` still passes in full, including
      `strict loading with new record on concat is ignored` (the #5767
      regression) — verified failing on a baseline that drops the param.
- [ ] Any other functional-loader entry point that should honor
      `skip_strict_loading` is covered by the same mechanism rather than
      case-by-case.
