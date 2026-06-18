---
title: "assoc-associations-test-force-reload-async-validate"
status: ready
updated: 2026-06-18
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Follow-up to `assoc-associations-test-wave9-convert-canonical` (RFC 0019). Wave 9
landed the `_pushThrough` composite source-FK fix and converted the two `append
composite has many through association[_with_autosave]` bodies onto canonical
`ShardedBlogPost.tags`. It deferred the other two blocked Rails-counterpart
bodies, each gated on a separate impl gap.

This story covers the `force reload` Rails counterpart (`test_force_reload`,
Firm/Client). Saving the OFFICIAL canonical `Client`
(`packages/activerecord/src/test-helpers/models/company.ts:316`,
`this.validate(async function () { await this.firm; })`) throws
`Error: Async callback on sync chain "validate" — before returned a Promise`
from `packages/activesupport/src/callbacks.ts:800`. The official `Client`'s
async `validate` callback runs on a strict-sync validation chain; no existing
test saves the official `Client` directly, so this gap is latent.

The bespoke `force reload` body lives in the FIRST `AssociationsTest` describe of
`packages/activerecord/src/associations.test.ts` (uses scratch tables
`c_posts`/`c_comments`).

- trails: `packages/activerecord/src/associations.test.ts`,
  `packages/activesupport/src/callbacks.ts`,
  `packages/activerecord/src/test-helpers/models/company.ts`
- Rails: `vendor/rails/activerecord/test/cases/associations_test.rb`
  (`test_force_reload`)

## Acceptance criteria

- [ ] Fix the sync/async callback classification so a model with an async
      `validate` callback saves via the async path (converge, don't ratify).
- [ ] Convert the `force reload` body onto canonical Firm/Client + fixtures,
      move it into the canonical describe, and remove scratch tables
      `c_posts`/`c_comments` as their last consumer is converted.
- [ ] test:compare delta non-negative.
