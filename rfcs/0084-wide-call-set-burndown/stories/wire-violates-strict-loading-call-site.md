---
title: "wire-violates-strict-loading-call-site"
status: done
updated: 2026-08-13
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6472
claim: "2026-08-13T16:15:37Z"
assignee: "wire-violates-strict-loading-call-site"
blocked-by: null
closed-reason: null
---

## Context

Split out of `burndown-associations` (RFC 0084) after the post-0083 re-measure.

`Association#violates_strict_loading?`
(vendor/rails/activerecord/lib/active_record/associations/association.rb:284-292)
now has a faithful body in trails (`association.ts:901`, converged in the
naming/associations burndown PR) — but **nothing calls it**. A repo-wide grep
for `isViolatesStrictLoading` finds only its own definition.

In Rails it gates the strict-loading raise on the association read path
(`load_target` / `find_target`, association.rb:154 and the CollectionAssociation
reader). trails raises from other sites instead, which is why the ported
predicate is dead. Until it is wired, its three Rails branches
(`@skip_strict_loading`, `owner.validation_context.nil?`,
`reflection.options.key?(:strict_loading)`) have no observable effect.

## Acceptance criteria

1. `isViolatesStrictLoading` is called from the Rails call site(s), and the
   ad-hoc strict-loading raise conditions it duplicates are removed.
2. Each Rails branch has a covering test: skip-strict-loading, in-validation
   (`validationContext` set), reflection-level `strict_loading:`, and
   `n_plus_one_only` mode.
3. Verified against `vendor/rails/activerecord/test/cases/strict_loading_test.rb`
   — every test in that file, not just the ones already ported.
