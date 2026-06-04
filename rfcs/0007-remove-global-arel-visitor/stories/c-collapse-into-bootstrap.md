---
title: "Phase C — delete syncHandlerVisitor / beforeEach (folds into RFC 0002)"
status: done
rfc: "0007-remove-global-arel-visitor"
cluster: arel-visitor
deps: ["b-drop-global-sync-sites"]
deps-rfc: []
est-loc: 50
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

With the global no longer dialect-synced (Phase B), `bootstrap-test-handler.ts`'s
`syncHandlerVisitor` and `setupHandlerSuite()`'s `beforeEach` are dead code.
Delete them. This work is the same as — and lands with — RFC 0002's PR 2/3
([[rework-test-setup]] / [[delete-bootstrap-handler]]); this story tracks the
visitor-removal half of that.

This **replaces** the old "PR 0 visitor-on-establish" approach (RFC 0002
`visitor-on-establish`, #2600 closed): the global is removed, not grown.

See RFC 0007 §Plan (Phase C) and §Disposition of #2600.

## Acceptance criteria

- [ ] `syncHandlerVisitor` deleted from `bootstrap-test-handler.ts`
- [ ] `setupHandlerSuite()` `beforeEach` visitor-sync removed
- [ ] Coordinated with RFC 0002 PR 2/3 so the test-setup rework lands consistently
- [ ] Full suite green on all three drivers

## Notes

From the arel-visitor plan (Phase C). Cross-RFC: this realizes the visitor
removal that RFC 0002's `visitor-on-establish` story originally proposed via the
opposite (install-on-establish) approach — that story is superseded.
