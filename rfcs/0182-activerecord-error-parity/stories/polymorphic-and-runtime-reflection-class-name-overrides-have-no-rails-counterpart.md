---
title: "activerecord: delete the PolymorphicReflection / RuntimeReflection className overrides Rails does not define"
status: in-progress
updated: 2026-10-07
rfc: "0182-activerecord-error-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8611
claim: "2026-10-07T02:09:26Z"
assignee: "environment-mismatch-error-message-matches-rails"
blocked-by: null
closed-reason: null
---

## Context

Rails defines `class_name` once, on `AbstractReflection` (`vendor/rails/v8.0.2/activerecord/lib/active_record/reflection.rb:190-192`): `@class_name ||= -(options[:class_name] || derive_class_name).to_s`. trails#8602 ported that body onto `AbstractReflection#className` (`packages/activerecord/src/reflection.ts:135`) and deleted the `MacroReflection`, `AssociationReflection` and `ThroughReflection` overrides.

Two overrides remain that Rails does not have:

- `PolymorphicReflection#className` (`reflection.ts:1534`) returns `this._reflection.className`. Rails' `PolymorphicReflection` delegates only `:klass, :scope, :plural_name, :type, :join_primary_key, :join_foreign_key, :name, :scope_for` (`reflection.rb:1229-1230`) and defines neither `options` nor `derive_class_name`, so `class_name` on one raises `NoMethodError`.
- `RuntimeReflection#className` (`reflection.ts:1589`) returns `this._reflection.className`, beside invented `name`, `pluralName` and `options` getters (`reflection.ts:1585-1629`). Rails' `RuntimeReflection` delegates only `:scope, :type, :constraints, :join_foreign_key` (`reflection.rb:1259`) and defines `klass`, `aliased_table`, `join_primary_key`, `all_includes`.

## Acceptance criteria

- [ ] Every caller that reads `className` (and `name` / `pluralName` / `options` on `RuntimeReflection`) off a `PolymorphicReflection` or `RuntimeReflection` is identified and converged onto the reader Rails uses at that site.
- [ ] The overrides Rails does not define are deleted; `AbstractReflection#className` is the only `className` body, as in `reflection.rb:190-192`.
- [ ] Association, through, polymorphic and disable-joins suites stay green.
