---
title: "base-prevent-writes declares a bespoke Bird instead of the canonical model"
status: done
updated: 2026-07-31
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 5740
claim: "2026-07-31T19:15:04Z"
assignee: "base-prevent-writes-declares-bespoke-bird-model"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/base-prevent-writes.test.ts` declares its own
`class Bird extends Base { static { this.attribute("name", "string"); } }`
inside the `describe`. Rails' counterpart
(`vendor/rails/activerecord/test/cases/base_prevent_writes_test.rb:4`) does
`require "models/bird"`, and trails already carries that model at
`packages/activerecord/src/test-helpers/models/bird.ts` (canonical `birds`
table at `test-helpers/test-schema.ts:154`).

The inline class is a bespoke model shadowing a canonical one. The declared
`name` attribute also suppresses DB reflection, so the test is not exercising
the canonical column set. `bird.rb` additionally carries a `before_save` that
forces `materialize_transactions` — the very behaviour the
"an empty transaction does not raise if preventing writes" test counts queries
around in Rails — so the substitution is not behaviour-neutral.

Surfaced while removing the trails-only professors rebuild from this file (#5732).

## Acceptance criteria

- The inline `Bird` class is deleted; the test imports
  `Bird` from `test-helpers/models/bird.js`.
- The suite gets the `birds` table through the canonical schema
  (`fixtures([...])`), not an implicit declaration.
- All eight tests still pass on sqlite, postgresql and mysql2.
