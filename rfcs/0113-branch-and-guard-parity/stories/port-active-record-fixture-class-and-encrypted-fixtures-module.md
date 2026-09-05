---
title: "port-active-record-fixture-class-and-encrypted-fixtures-module"
status: draft
updated: 2026-09-05
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activerecord/lib/active_record/fixtures.rb` defines
`ActiveRecord::Fixture`, a per-row object holding `@fixture` and `@model_class`,
and `vendor/rails/activerecord/lib/active_record/encryption/encrypted_fixtures.rb`
defines `ActiveRecord::Encryption::EncryptedFixtures`, a module PREPENDED onto
that class so its `initialize` encrypts the row before `super`.

trails has neither. `packages/activerecord/src/fixtures.ts` is row-array based:
there is no `Fixture` class, and the port of `encrypted_fixtures.rb` is the
module-private function `encryptFixtureRows` (`fixtures.ts:466`), called inline
at `fixtures.ts:809` behind `Configurable.config.encryptFixtures`.

That inline gate is behaviourally equivalent to Rails' boot-time prepend, but it
is structurally a different shape, and it is what blocks
`trailtie-encrypt-fixtures-arm`: `railtie.rb:357-362`'s arm body is
`ActiveRecord::Fixture.prepend ActiveRecord::Encryption::EncryptedFixtures`, and
there is no class to prepend onto. Moving the gate to boot without the class
also breaks `encryption/encrypted-fixtures.test.ts`, which configures encryption
in `beforeAll` — long after `fixtures.ts` module load has already fired
`runLoadHooks("active_record_fixture_set", FixtureSet)` (`fixtures.ts:975`).

## Acceptance criteria

- [ ] `ActiveRecord::Fixture` is ported at its Rails file and name, carrying the
      `fixture` / `model_class` pair the row pipeline builds.
- [ ] `encrypted_fixtures.rb` is ported at its own file as `EncryptedFixtures`,
      with `encryptFixtureData` and `processPreservedOriginalColumns` at their
      Rails names, replacing `encryptFixtureRows` in `fixtures.ts`.
- [ ] `encryption/encrypted-fixtures.test.ts` stays green.
- [ ] `trailtie-encrypt-fixtures-arm` is unblocked by this landing.
