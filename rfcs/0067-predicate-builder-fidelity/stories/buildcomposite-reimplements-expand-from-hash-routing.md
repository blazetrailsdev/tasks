---
title: "buildComposite re-implements expand_from_hash routing instead of delegating"
status: draft
updated: 2026-07-24
rfc: "0067-predicate-builder-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`PredicateBuilder#buildComposite`
(`packages/activerecord/src/relation/predicate-builder.ts:426-508`) is a
trails-only surface — JS object keys cannot be arrays, so
`Relation#where(cols, tuples)` exists in place of Rails'
`where({[c1, c2] => [[v1, v2], ...]})`.

Its body re-implements routing that Rails already does inside
`expand_from_hash`:

- Qualified-col splitting (added by #5186, `predicate-builder.ts:458-466`)
  duplicates `convert_dot_notation_to_hash`
  (`vendor/rails/activerecord/lib/active_record/relation/predicate_builder.rb:162-179`)
  plus the `value.is_a?(Hash) && !table.has_column?(key)` re-rooting branch
  (`predicate_builder.rb:105-106`).
- Tuple → predicate grouping duplicates the Array-key branch
  (`predicate_builder.rb:87-98`) and `grouping_queries`
  (`predicate_builder.rb:154-162`).

Two known shape deviations are already documented in the method's JSDoc:
`buildComposite` must return ONE node, so each tuple gets its own
`Grouping` (Rails wraps only the outer `Or`, and returns flat predicates
for the single-tuple case); and the single-col case degenerates to `IN`
rather than an OR-chain.

Converging `buildComposite` onto a thin adapter that zips
`cols`/`tuples` into the Array-key hash shape and delegates to
`expandFromHash` would delete the duplicated routing and make future
`expand_from_hash` fixes apply automatically — #5186 is the second fix
in this file that had to be applied to `buildComposite` separately.

## Acceptance criteria

- [ ] `buildComposite` delegates to `expandFromHash`'s Array-key path
      (zip cols with each tuple) rather than re-implementing dot-notation
      splitting, bind construction, and grouping — or the divergence is
      justified at the call site with the Rails citation showing why the
      delegation is impossible.
- [ ] Existing `composite-where.test.ts` behavior is preserved, including
      the arity/shape ArgumentError messages and the null-component
      filtering, or each intentional change is called out.
- [ ] No test renames; api:compare / test:compare delta non-negative.
