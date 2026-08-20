---
title: "activerecord hand-rolls class_attribute semantics; classAttribute() has zero callers"
status: in-progress
updated: 2026-08-20
rfc: "0112-one-rails-thing-n-trails-things"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 6776
claim: "2026-08-20T16:23:13Z"
assignee: "converge-join-dependency-through-aliasing-test-to-canonical-models"
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/class-attribute.ts:70` exports `classAttribute()`,
a full port of Rails' `class_attribute`
(`vendor/rails/activesupport/lib/active_support/core_ext/class/attribute.rb:86`).
Its contract is the Rails one: _"reads walk the constructor chain; writes are
local to the class/instance"_, with `instanceAccessor` / `instanceReader` /
`instanceWriter` / `instancePredicate` / `default` options
(`class-attribute.ts:8-14`). It is exported from the package index
(`activesupport/src/index.ts:387`).

**It has zero callers.** Measured 2026-08-19:

```text
classAttribute( call sites, non-test:
  activemodel   0
  activerecord  0
  arel          0
  actionpack    0
```

Rails leans on `class_attribute` heavily — 51 occurrences in
`vendor/rails/activerecord/lib/active_record/*.rb` alone, plus
`attribute_methods.rb:71-72` (`attribute_aliases`,
`attribute_method_patterns`), `conversion.rb:32` (`param_delimiter`),
`serializers/json.rb:15` (`include_root_in_json`) and `validations.rb:50`
(`_validators`) in activemodel.

In its place trails hand-rolls the per-subclass copy semantics, repeatedly:

- `packages/activerecord/src/associations/builder/association.ts:288`
  `_ensureOwnAssociations` (called at `:140`)
- `packages/activerecord/src/base.ts:1012` — a `hasOwnProperty` per-class
  store, commented _"Per-class via hasOwnProperty — does not inherit from
  parent"_, which is the opposite of `class_attribute`'s read semantics
- `packages/activemodel/src/model.ts:1453` `_ensureOwnValidators`
- `packages/activemodel/src/attribute-methods.ts:735` `ensureOwnPatterns`,
  `:741` `ensureOwnAliases` (six call sites)
- `packages/activemodel/src/attribute-registration.ts:402`
  `registerWithSuperclass`

This is the RFC 0112 shape exactly: **one Rails construct, N trails
spellings**. It is also not merely cosmetic — `_ensureOwnValidators`' own JSDoc
records a behavioural divergence it causes (a subclass that never registers a
validator keeps seeing validators the parent adds afterwards, where Rails'
`inherited` hook snapshots at class-definition time).

**Scope split.** The five activemodel spellings are owned by RFC 0115 (its F0
finding, and the stories `converge-attribute-methods-copy-on-write-and-alias-helpers`,
`converge-attribute-registration-pending-modification-helpers` and
`fan-out-model-validation-runner-surface-to-validations`). **This story is the
activerecord half only** — do not touch activemodel files, they are claimed.

## Acceptance criteria

- `_ensureOwnAssociations` (`associations/builder/association.ts:288`) is
  replaced by `classAttribute()`, matching whichever `class_attribute` Rails
  declares for the association registry.
- The `hasOwnProperty` per-class store at `base.ts:1012` either becomes a
  `classAttribute()` — if the Rails counterpart is a `class_attribute`, which
  the porter must confirm and cite — or its comment is corrected to name the
  Rails construct it actually mirrors.
- An inventory of the remaining `class_attribute` declarations in
  `vendor/rails/activerecord/lib/active_record/*.rb` (51 of them) against how
  trails spells each, filed as follow-up stories for anything not converged
  here. Do not attempt all 51 in one PR.
- No new copy-on-first-write helper is introduced under any name.
- `pnpm parity:api` / `pnpm parity:test` deltas non-negative;
  `pnpm parity:api:calls` and `:args` clean, no reseed.

## Verification

```bash
grep -rn "classAttribute(" packages/activerecord/src --include=*.ts | grep -v test
pnpm vitest run packages/activerecord/src/associations.test.ts
```
