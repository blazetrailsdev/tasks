---
title: "Route inverse collection wiring through replace_on_target(inversing:)"
status: draft
updated: 2026-07-27
rfc: "0075-collection-association-target-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 110
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails folds an inverse record into a collection through the _same_
`replace_on_target` every other add uses, with one flag:

```ruby
# collection_association.rb, CollectionAssociation#target=
replace_on_target(record, true, replace: true, inversing: true)
```

`inversing` only widens the `@replaced_or_added_targets` append condition
(`@replaced_or_added_targets << record if inversing || index || record.new_record?`,
collection_association.rb:483).

trails instead reimplements the whole body a second time:
`CollectionAssociation#inversedFrom`
(`packages/activerecord/src/associations/collection-association.ts`) dispatches
to `CollectionProxy#_wireInverseTarget`
(`packages/activerecord/src/associations/collection-proxy.ts`), which
hand-rolls the index lookup, the identity-set write, and the replace/append —
a duplicated copy of `replace_on_target` that can drift (and did: the OO
`beginReplaceOnTarget` index guard had already drifted before #5461 fixed it).

PR #5461 unified the target array and `@replaced_or_added_targets` across both
surfaces, so a single `replace_on_target` can now serve this path.

## Acceptance criteria

- [ ] `_wireInverseTarget`'s body is deleted; inverse wiring routes through the
      shared `replaceOnTarget` with an `inversing` argument.
- [ ] `inversing` widens only the `@replaced_or_added_targets` append condition,
      per collection_association.rb:483 — no other behavior change.
- [ ] `set_inverse_instance` is still not re-invoked on this path (the caller in
      `associations.ts` establishes the reciprocal side; re-wiring recurses).
- [ ] `has_many_inversing` suites and the inverse-association tests stay green.
