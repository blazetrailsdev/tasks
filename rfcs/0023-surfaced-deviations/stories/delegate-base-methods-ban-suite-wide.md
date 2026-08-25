---
title: "Delegation: enable delegate_base_methods ban suite-wide in AR test harness (mirror helper.rb:29)"
status: done
updated: 2026-06-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 3996
claim: "2026-06-23T13:42:38Z"
assignee: "delegate-base-methods-ban-suite-wide"
blocked-by: null
---

## Context

PR #3987 added the `delegate_base_methods` guard
(`packages/activerecord/src/relation/delegation.ts` `guardBaseMethodDelegation`)
and `DelegateCache.delegateBaseMethods` (default `true`, matching Rails
`delegation.rb:25`). Rails' own test suite sets the flag to **false** suite-wide
in `vendor/rails/activerecord/test/cases/helper.rb:29`:

    ActiveRecord::Delegation::DelegateCache.delegate_base_methods = false

so that any AR-internal code (or test) relying on delegating a relation /
collection-proxy call into an `ActiveRecord::Base` method raises and is caught.
trails currently only flips the flag to `false` inside the single
`delegate_base_methods guard` test block in `delegation.test.ts` and restores it
in `afterEach`. The guard is therefore inert across the rest of the AR suite, so
real delegation-into-Base regressions go undetected — the opposite of Rails'
intent.

## Acceptance criteria

- [x] Default `DelegateCache.delegateBaseMethods = false` in the trails AR test
      harness (mirror `helper.rb:29`), in the shared test setup so it applies to
      every AR `*.test.ts`.
- [x] Fix or explicitly annotate any test fallout where trails code/tests
      currently rely on delegating a Base method through a relation/proxy
      (each is a genuine deviation to converge, not to suppress).
- [x] Production default stays `true` (only the test harness flips it), matching
      Rails.

## Notes

Scope/size is uncertain until the flag is flipped and fallout measured; the
est-loc is a guess. If fallout is large, split per-cluster follow-ups rather
than one mega-PR (CLAUDE.md 500 LOC ceiling).
