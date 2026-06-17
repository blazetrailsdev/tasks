---
title: "Await async before_validation callbacks on the validation chain"
status: done
updated: 2026-06-17
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 12
pr: 3495
claim: "2026-06-16T20:00:41Z"
assignee: "async-before-validation-sync-chain"
blocked-by: null
---

## Context

Surfaced while canonicalizing `has_and_belongs_to_many_associations_test.ts`
(RFC 0019, PR #3480). `association with validate false … on update` stays
skipped because it cannot run:

`RichPerson` (test-helpers/models/person.ts) declares an **async**
`before_validation` callback. The test's precondition `RichPerson.createBang({})`
runs validations, and the synchronous validation callback chain rejects the
async callback with:

> Async callback on sync chain "validation" — before returned a Promise

This is unrelated to HABTM / `throughReflection`; it is a general gap in the
validation callback chain, which is invoked synchronously and cannot await a
Promise-returning `before_validation`.

Rails runs `before_validation` callbacks in the normal (awaitable in our port)
callback flow, so an async callback should be supported.

## Acceptance criteria

- [x] ~~The validation callback chain awaits Promise-returning
      `before_validation` / `after_validation` callbacks instead of throwing
      "before returned a Promise".~~ SUPERSEDED (PR #3495): owner decided to
      keep validation synchronous and converge the deviation at its source —
      RichPerson's `before_validation` callbacks only do synchronous
      `writeAttribute` and Rails declares them sync
      (activerecord/test/models/person.rb:98-114), so the `async` wrappers were
      an unfaithful port artifact and were made synchronous. The general
      this-binding gap is owned by the done story
      `proc-callback-this-instance-exec-binding` (PR #3493).
- [x] Un-skip `association with validate false does not run associated
validation callbacks on update` in
      `associations/has-and-belongs-to-many-associations.test.ts` (verbatim
      name) and assert as Rails does (haabtm_test.rb:874-885).
- [x] No regression in the validations + callbacks suites.
