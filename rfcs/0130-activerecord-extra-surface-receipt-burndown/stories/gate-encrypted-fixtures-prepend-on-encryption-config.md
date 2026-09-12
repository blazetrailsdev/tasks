---
title: "Gate the EncryptedFixtures prepend on encrypt_fixtures, as railtie.rb does"
status: ready
updated: 2026-09-12
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 8
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails prepends `ActiveRecord::Encryption::EncryptedFixtures` onto `ActiveRecord::Fixture`
CONDITIONALLY, from the railtie:

    # vendor/rails/activerecord/lib/active_record/railtie.rb:359-360
    if ActiveRecord::Encryption.config.encrypt_fixtures
      ActiveRecord::Fixture.prepend ActiveRecord::Encryption::EncryptedFixtures
    end

trails prepends it unconditionally at module load
(`packages/activerecord/src/fixtures.ts`, bottom: `prepend(Fixture.prototype, EncryptedFixtures)`),
so the encrypting `initialize` runs for every `Fixture` whose model has
`encryptedAttributes`, regardless of `Encryption.config.encryptFixtures`.

Before PR #7723 the gate lived at the call site: `prepareModelFixtures` only constructed a
`Fixture` when `Configurable.config.encryptFixtures && isPresent(ModelClass.encryptedAttributes)`.
PR #7723 moved row building onto `FixtureSet::TableRows` (`fixture_set/table_rows.rb:31-41`), which
builds a `TableRow` per fixture and therefore needs a `Fixture` for EVERY row
(`fixtures.rb:742-751`). To preserve the old behaviour without re-deriving it, that call site now
passes `new Fixture(row, encryptFixtures ? ModelClass : null)` — a null model class so the
prepended body finds no `encryptedAttributes`.

That is a workaround: the condition Rails puts on the PREPEND is expressed as a doctored
constructor argument, and `Fixture#model_class` (`fixtures.rb:815`, `attr_reader :model_class`) is
consequently nil for rows Rails would still give a real model class to.

## Converged shape

Move the condition to where Rails has it — the prepend — so `Fixture` is always constructed with
its real model class:

- prepend `EncryptedFixtures` only when `Encryption.config.encryptFixtures` is set, mirroring
  `railtie.rb:359-360` (trailties' active_record railtie port is the natural host, alongside the
  other `onLoad`-gated encryption wiring), or
- if the prepend must stay unconditional because trails has no railtie on that path, gate the
  ported `EncryptedFixtures#initialize` body itself on that config and record it as the relocated
  railtie condition.

Then `prepareModelFixtures` passes `new Fixture(row, ModelClass)` unconditionally, as
`fixtures.rb` does.

## Acceptance criteria

- [ ] `Fixture` is constructed with its real model class for every row.
- [ ] Encryption still applies only when `Encryption.config.encryptFixtures` is set.
- [ ] `packages/activerecord/src/test-fixtures.test.ts` encrypted-fixtures coverage still passes.
