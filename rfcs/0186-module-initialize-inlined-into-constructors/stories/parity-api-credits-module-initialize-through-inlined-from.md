---
title: "parity:api credits a module's initialize through an @inlinedFrom constructor; the three skip entries go"
status: draft
updated: 2026-10-08
rfc: "0186-module-initialize-inlined-into-constructors"
cluster: tooling
packages: ["scripts"]
deps: ["extractor-reads-inlined-from-tags-on-constructors"]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0186 § Design: a module's `initialize` is inlined into the constructor of each class that includes or prepends it, at the position Ruby's `super` occupies, and the constructor carries one `@inlinedFrom Module#initialize` tag per segment in chain order.

Three `initialize` definitions are in `SCOPED_SKIP_GROUPS` because a module's `initialize` has no TS member to pair with (`scripts/parity/conventions.ts:843-891`): `ActiveSupport::Messages::Rotator#initialize` (`messages/rotator.rb:6-12`), `ActiveModel::API#initialize` (`api.rb:78-81` as cited there), and `ActiveRecord::Fixture#initialize` with `EncryptedFixtures` (`fixtures.rb:817-820`, `encryption/encrypted_fixtures.rb:6-11`). Each names a `tsMirrorName: "initialize"`.

## Acceptance criteria

- `parity:api` scores a module's `initialize` as matched when a constructor in the mirror of a Rails file that includes or prepends the module carries the tag.
- The crediting rule is recorded where RFC 0179's crediting rules live, with a test.
- The three skip entries are deleted in the PR that converts their module, not here; this story leaves them and proves the credit on a fixture.
- `pnpm parity:api` totals are stated before and after, and the delta is non-negative.
