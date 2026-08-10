---
title: "migrate-has-one-assignments-to-awaitable-writer"
status: done
updated: 2026-08-05
rfc: "0087-awaitable-association-writers-only"
cluster: null
deps: []
deps-rfc: []
est-loc: 400
priority: 5
pr: 6118
claim: "2026-08-05T03:29:59Z"
assignee: "port-respond-to-missing-finder-to-dynamic-matchers"
blocked-by: null
closed-reason: null
---

## Context

Ported tests and helpers assign has_one associations with the generated
synchronous property setter (`pirate.ship = ship`,
`firm.account = account`), which RFC 0087 deletes. The setter is reached from
`defineWriters` (`packages/activerecord/src/associations/builder/has-one.ts:88`,
the `Object.defineProperty(mixin, name, ...)` arm) and routes to
`HasOneAssociation#syncWrite` (`associations/has-one-association.ts:51`), whose
persisted-owner branch already throws `HasOnePersistedAssignmentError`.

This story migrates the call sites only — the setter still works afterwards, so
it is independently mergeable and does not need to land with the deletion.

Rails assigns with `=` because `HasOneAssociation#replace`
(`vendor/rails/activerecord/lib/active_record/associations/has_one_association.rb:59-84`)
does its I/O synchronously; the awaitable `set#{Name}`
(`builder/has-one.ts:106`) is the settled trails rendering of that writer, so
each site becomes `await owner.setShip(ship)`.

## Acceptance criteria

- [ ] Every has_one `=` assignment in `packages/activerecord/src/**` (tests,
      test-helpers and models included) becomes `await owner.set#{Name}(x)` or
      `await owner.association(name).writer(x)`.
- [ ] Test names are unchanged — only assignment expressions inside bodies move.
- [ ] `pnpm parity:test` delta non-negative.
- [ ] No new call-mismatch rows; the setter itself is NOT yet deleted.
