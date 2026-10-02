---
title: "TestCase#process and Integration::Session dispose the html document where Rails assigns nil"
status: done
updated: 2026-10-02
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8373
claim: "2026-10-02T01:22:05Z"
assignee: "arel-dot-accept-requires-collector"
blocked-by: null
closed-reason: null
---

## Context

Rails resets the memoized document with a bare assignment:
`@html_document = nil` in `ActionController::TestCase::Behavior#process`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/test_case.rb:519`) and in
`ActionDispatch::Integration::Session#process` / `#reset!`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/testing/integration.rb`).
Ruby's GC frees the Nokogiri document.

trails calls `this._htmlDocument?.dispose()` before the assignment, at
`packages/actionpack/src/action-controller/test-case.ts` (`process`) and
`packages/actionpack/src/action-dispatch/testing/integration.ts:108,283`.
`XmlDocument#dispose` (`packages/nokogiri/src/xml/document.ts:38-42`) frees the
libxml2 handle. The call has no Rails counterpart and carries no call-site
receipt.

## Acceptance criteria

- The three sites are the bare `this._htmlDocument = undefined` Rails has, with
  the handle released by the nokogiri port itself (a `FinalizationRegistry` on
  `XmlDocument`, the JS analogue of Ruby's GC freeing the document).
- If a finalizer cannot release the handle, the story is blocked with that
  specific reason rather than the call being receipted.
