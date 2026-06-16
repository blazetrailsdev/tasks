---
title: "CollectionProxy/Relation method_missing → Array delegation (e.g. .sort)"
status: claimed
updated: 2026-06-16
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 14
pr: null
claim: "2026-06-16T20:12:45Z"
assignee: "collection-proxy-array-method-missing-delegation"
blocked-by: null
---

## Context

Surfaced while converting `associations/join-model.test.ts` to canonical
(PR #3464, RFC 0019). Rails' `CollectionProxy`/`Relation` delegate **arbitrary
`Array` methods** through `method_missing` → `records`/`to_a` → `Array#<method>`
(e.g. `authors(:david).categories.sort`). trails exposes only a curated proxy
surface (`CollectionProxy#any`, etc. — `associations/collection-proxy.ts:306`)
and `wrapWithScopeProxy` (`relation/delegation.ts:157`) only routes generated
relation methods + named scopes, not Array methods.

Consequence: the ported `test_has_many_array_methods_called_by_method_missing`
cannot drive `categories.sort` through the proxy; PR #3464 ports the `any? {}`
half via `CollectionProxy#any` and degrades the `sort` clause to a plain-array
sort with an inline deviation comment.

- Rails: `activerecord/lib/active_record/relation/delegation.rb`
  (`method_missing` → `Array` delegation via `Delegation::ClassMethods`)
- trails: `associations/collection-proxy.ts`, `relation/delegation.ts:157`

## Acceptance criteria

- [ ] Decide scope: either implement Array-method delegation on the
      collection-proxy/relation (load → `Array.prototype[method]`) matching
      Rails, or ratify the deviation with a documented reason.
- [ ] If implemented: `categories.sort` / other Array methods work through the
      proxy without an explicit `toArray()`; restore the faithful
      `test_has_many_array_methods_called_by_method_missing` body.
- [ ] Fidelity-first: converge to Rails unless there is a concrete JS reason
      not to.
