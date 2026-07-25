---
title: "Move the trails-only Slot B proxy-build test out of the Rails-named autosave describe"
status: claimed
updated: 2026-07-25
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-07-25T13:29:39Z"
assignee: "move-slot-b-proxy-build-test-to-trails-sibling-file"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/autosave-association.test.ts`'s
`TestDefaultAutosaveAssociationOnAHasManyAssociation` describe carries a
trails-only test that has no Rails counterpart:

`it("collection-proxy build without load autosaves built children (Slot B)")`

It is a regression test for the proxy-build-without-load gap — building through
`record.<collection>.build(...)` with no preload and no explicit load must
still surface the built record to the autosave loop. Valuable, but the repo
convention is that TS-only extras live in a sibling `*.trails.test.ts` file,
not inside a describe whose name is matched against a Rails test class by
`test:compare`. Sitting inside a Rails-named describe, it inflates that
describe's apparent test count against Rails' `TestDefaultAutosaveAssociation
OnAHasManyAssociation`, which has no such test
(`vendor/rails/activerecord/test/cases/autosave_association_test.rb:816-1099`).

It predates PR 5278 — that PR only retargeted its body from the bespoke
`AutosaveFirm`/`AutosaveClient` pair onto canonical `Firm`/`Client`, leaving
the placement alone as out of scope.

## Acceptance criteria

- Move the test to `autosave-association.trails.test.ts` (create it if absent),
  keeping the body and its explanatory comment verbatim.
- The moved test keeps using canonical `Firm` / `clientsOfFirm` and the
  canonical fixture set, exactly as it does today — no bespoke models.
- Confirm it still fails on a baseline without the `_loadedAssociation`
  non-empty-target handling it guards, so the move does not quietly defang it.
- Check the same describe (and its siblings in the file) for other
  Rails-less tests that belong in the same sibling file, and move them too.
