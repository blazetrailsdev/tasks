---
title: "load-hook-installed-module-initializes-and-activerecord-missing-tag-enrollment"
status: in-progress
updated: 2026-10-19
rfc: "0188-module-initialize-inlined-into-constructors"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9059
claim: "2026-10-19T12:48:04Z"
assignee: "deduplicable-new-runs-after-the-most-derived-constructor"
blocked-by: null
closed-reason: null
---

## Context

Deferred from the bundle that inlined Rotator, Timezone and i18n's module `initialize`s. Two activerecord modules carrying an `initialize` are installed by a runtime hook, so no constructor knows statically that it includes them:

- `ActiveRecord::Encryption::EncryptedFixtures#initialize` (`vendor/rails/v8.0.2/activerecord/lib/active_record/encryption/encrypted_fixtures.rb:6-11`) is prepended onto `Fixture` only inside `ActiveSupport.on_load(:active_record_fixture_set)` and only when `config.encrypt_fixtures` is set (`vendor/rails/v8.0.2/activerecord/lib/active_record/railtie.rb:357-362`); the test helper prepends it unconditionally (`vendor/rails/v8.0.2/activerecord/test/cases/encryption/helper.rb:6`). trails ports both: `packages/trailties/src/trailties/active-record.test.ts` tests both arms ("runInitializers prepends EncryptedFixtures when encrypt_fixtures is set" / "... does not prepend ..."), and `packages/activerecord/src/encryption/test-helpers.ts:26` prepends it. Inlining it into `Fixture`'s constructor (`packages/activerecord/src/fixtures.ts:405`) unconditionally encrypts fixtures when `encrypt_fixtures` is false.
- `ActiveRecord::Railties::ControllerRuntime#initialize` (`vendor/rails/v8.0.2/activerecord/lib/active_record/railties/controller_runtime.rb:26-29`) is included into `ActionController::Base` by an `on_load(:action_controller)` hook in another package; today it is the `[initialize]` symbol hook in `packages/activerecord/src/trailties/controller-runtime.ts`.

The RFC 0188 owner ruling for EncryptedFixtures (in `activerecord-fixture-initialize-prepend-constructor`) did not address the conditional install. The `fixtures.rb` / `encryption/encrypted_fixtures.rb` `initialize` entry in `SCOPED_SKIP_GROUPS` stays until this is decided.

Also: activerecord cannot yet join `MISSING_TAG_PACKAGES` in `scripts/api-compare/lint-inlined-from.ts`. Enrolling it reports 11 untagged segments: `Base` (Inheritance::ClassMethods#new, Core#initialize, API#initialize), `AbstractAdapter` (QueryCache#initialize, DatabaseStatements#initialize), `ConnectionPool` (QueryCache::ConnectionPoolConfiguration#initialize), `NormalizedValueType` (ActiveModel::Type::SerializeCastValue#initialize, served through `normalization.ts:100`'s `initializeIncludedModules`), and four `Deduplicable::ClassMethods#new` constructors (Column, SqlTypeMetadata, PostgreSQL/MySQL TypeMetadata).

## Acceptance criteria

- An owner decision on how a module `initialize` installed by a load hook (conditional prepend, cross-package include) is inlined, recorded in RFC 0188.
- EncryptedFixtures and ControllerRuntime converge on that decision; the `fixtures.rb` SCOPED_SKIP_GROUPS entry is deleted and `activerecord-fixture-initialize-prepend-constructor` is closed.
- The 11 untagged activerecord segments are tagged or inlined, and `activerecord` joins `MISSING_TAG_PACKAGES`.
