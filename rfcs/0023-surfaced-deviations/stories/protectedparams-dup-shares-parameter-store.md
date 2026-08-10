---
title: "ProtectedParams#dup gives the copy an independent parameter store"
status: closed
updated: 2026-08-09
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
closed-reason: "Not a Rails-fidelity convergence worth carrying: a test-support stub whose dup-aliasing is unobservable to the ported suite (no vendored Rails test dups a ProtectedParams), and the sharing is precluded by the per-instance Proxy design."
---

## Context

`ProtectedParams#dup`
(`packages/activerecord/src/support/stubs/strong-parameters.ts:127-131`, merged
in #5703) constructs a fresh `ProtectedParams` over the parameters, and the
constructor spreads them into a new store
(`strong-parameters.ts:52`). Rails' `dup`
(`vendor/rails/activerecord/test/support/stubs/strong_parameters.rb:35-39`) is
`super.dup` — `Object#dup` copies the ivar _reference_, so the original and the
copy share one `@parameters` hash; a write through either is visible to both.

The trails copy gets an independent store. This is forced by the
Proxy-per-instance design: the traps close over the store handed to the
constructor, so a shared store cannot be installed after construction. No
vendored Rails test mutates a dup'd `ProtectedParams` (only `finder_test.rb`,
`forbidden_attributes_protection_test.rb`, `calculations_test.rb`,
`hstore_test.rb`, `where_test.rb` construct/permit! it, none call `.dup`), so
the divergence is unobservable to the ported suite today — but it is a real
behavioral deviation, documented only in the stub's header docstring.

## Acceptance criteria

- `dup` shares the parameter store with the original, matching `Object#dup`:
  a write through the copy is visible on the original and vice versa. Likely
  shape: let the constructor accept an existing store to adopt by reference
  (private/internal path), so the copy's Proxy closes over the same object.
- The deviation paragraph in the `strong-parameters.ts` header docstring is
  removed once the behavior converges.
- The existing test pinning independent parameters is inverted to pin sharing;
  the permitted-carry-over tests keep passing.
- `pnpm parity:api --package activerecord-test-support` does not regress
  (32/32).
