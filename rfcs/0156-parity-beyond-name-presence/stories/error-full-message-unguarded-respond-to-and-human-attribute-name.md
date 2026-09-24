---
title: "Error.fullMessage: respond_to?(:i18n_scope) and unguarded human_attribute_name"
status: draft
updated: 2026-09-24
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveModel::Error.full_message` (`vendor/rails/activemodel/lib/active_model/error.rb:15-63`) has two unguarded reads that trails' `Error.fullMessage` (`packages/activemodel/src/error.ts`) spells differently:

- `:21` `base_class.respond_to?(:i18n_scope)` is ported as `baseClass?.i18nScope != null`. That is a value test, not a respond-to test: a class answering `i18n_scope` with `nil` differs.
- `:52-55` calls `base_class.human_attribute_name(attribute, {default:, base:})` unconditionally. trails guards it (`baseClass?.humanAttributeName ? … : attrName`), inventing an arm Rails does not have.

Also `base_class = base.class` (`:18`) is `base?.constructor` with an optional chain Rails does not have.

## Acceptance criteria

- `:21` is ported with `rbObjRespondTo(baseClass, "i18nScope")`, the repo's `respond_to?` port.
- `humanAttributeName` is called unconditionally, and `base.constructor` is read without the optional chain, as `error.rb:18,52` do. Tests that pass a `null` base or a bare class are converged onto Rails-shaped models (`error_test.rb` uses `Person`).
- `pnpm parity:api:calls` and the activemodel error tests stay green.
