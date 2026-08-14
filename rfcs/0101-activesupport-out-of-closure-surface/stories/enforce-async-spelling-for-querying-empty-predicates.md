---
title: "Enforce that a querying empty? is spelled async, so blank?'s probe needs no post-call guard"
status: done
updated: 2026-08-14
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6514
claim: "2026-08-14T12:27:03Z"
assignee: "converge-time-zone-reader-names"
blocked-by: null
closed-reason: null
---

## Context

`Object#blank?` is `respond_to?(:empty?) ? !!empty? : false`
(`activesupport/lib/active_support/core_ext/object/blank.rb:18-20`) — a
synchronous call that issues no I/O, because Ruby has no async `empty?`.

trails does: `Relation#isEmpty`, `CollectionAssociation#isEmpty`,
`Preloader#isEmpty` and `Querying#isEmpty` all run a query. PR #6506 made
`isBlank` invoke a method-shaped `isEmpty` as blank.rb:19 invokes `empty?`, and
excludes the querying ones by reading the function object's `AsyncFunction` tag
BEFORE the call (`packages/activesupport/src/core-ext/object/blank.ts#isBlank`).
`Function.prototype.bind` copies the target's prototype, so a bound async method
is excluded too — that is pinned by a test.

**The hole:** a NON-`async` function that returns a promise carries no
`AsyncFunction` tag, so it is invoked and its query is issued. Nothing readable
on the function object distinguishes it, and by the time the promise is in hand
the I/O has happened. `isBlank` therefore discards a thenable result and falls
through to the `Object.keys` arm — correct, but only AFTER the damage.

The contract that closes it is already stated in the code ("a querying `empty?`
is spelled `async`") and `Querying#isEmpty` was converted to `async` in #6506
specifically to satisfy it. What is missing is enforcement: nothing stops the
next `isEmpty` from being written as a bare `Promise<boolean>` return.

## Converged shape

The contract is enforced by construction rather than by convention, so
blank.rb:19's probe can invoke every non-`async` `empty?` knowing it is
synchronous. The natural home is an ESLint rule in `eslint/` (the repo already
generates Rails-derived manifests there): any method or function named
`isEmpty` / `empty` whose declared return type is `Promise<...>` — or which
returns a call to something awaited — must carry the `async` keyword.

With that rule armed, the post-call thenable discard in `isBlank` becomes dead
code and should be deleted along with its test, leaving the body exactly
blank.rb:18-20.

## Acceptance criteria

- [ ] A lint rule fails a non-`async` `isEmpty`/`empty` that returns a promise.
- [ ] The rule is armed repo-wide and the existing surface passes it.
- [ ] `isBlank`'s post-call thenable discard and its "discards a thenable
      result" test are deleted; the JSDoc paragraph describing the hole goes
      with them.
