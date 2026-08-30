---
title: "move-alias-attribute-generation-off-the-schema-load-hook"
status: done
updated: 2026-08-30
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 7220
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `load_schema!` (`activerecord/lib/active_record/model_schema.rb:587-597`)
defines no attribute methods at all — it reflects columns, memoizes
`_default_attributes`, and returns. Attribute methods, and with them the alias
attribute methods `generate_alias_attributes` mass-generates
(`activerecord/lib/active_record/attribute_methods.rb:127-139`), are generated
lazily from `define_attribute_methods`, reached through `method_missing` /
`respond_to?` — that is, at first use of an instance.

trails' `defineAttributeMethodsAfterLoad`
(`packages/activerecord/src/model-schema.ts:589`, called from
`loadSchemaBangAnchor` at `:568`) calls `defineAttributeMethods()` at the END of
every schema load. The hook itself is ratified (CLAUDE.md, "Generated attribute
readers are properties": a trails reader is a property, so there is no
`method_missing` miss to hook), but it generates the ALIAS half too, which Rails
keeps lazy and which needs nothing from the property model.

That is not cosmetic. It is the blocker on
`converge-alias-attribute-not-an-attribute-raise`: Rails'
`alias_attribute_method_definition` raise (`attribute_methods.rb:87-97`) fires at
instantiation, but under this hook it fires at schema-load time, which reds
`attributes.test.ts > .type_for_attribute supports attribute aliases`
(`activerecord/test/cases/attributes_test.rb:54`) — its `WithAlias` aliases a
non-attribute deliberately and is never instantiated, so Rails never raises.

Dropping the whole generate call was tried on PR #7216 and reverted: the hook is
load-bearing beyond instantiation. Without it these red on every lane —
`packages/activerecord/src/base.trails.test.ts:277`
(`"first_name" in Developer.prototype`),
`packages/activerecord/src/model-schema-load-own-table-descendant.trails.test.ts:76`,
`:100`, `:113` (the STI base's `_schemaLoaded` propagation) and
`packages/activerecord/src/secure-token.test.ts > SecureTokenTest > token calls
the setter method`. So the plain-reader half must stay; only the alias half moves.

## Converged shape

A schema load generates the plain attribute readers trails' property model needs
and nothing else. `generateAliasAttributes`
(`packages/activerecord/src/attribute-methods.ts:319-337`, mirroring
`attribute_methods.rb:127-139`) runs at Rails' demand point instead — the
instance path, `Core#init_internals` (`packages/activerecord/src/core.ts:614`) —
so an alias is generated when a record is built, never when a column set is
reflected.

Note the two flags are already separate — `_attributeMethodsGenerated` and
`_aliasAttributesMassGenerated` — but `defineAttributeMethods` sets both, and its
own `return false if @attribute_methods_generated` guard
(`attribute_methods.rb:104`) means a later call from `init_internals` returns
early and generates no aliases. Splitting the two demand points is the work.

## Acceptance criteria

- [ ] A schema load no longer mass-generates alias attribute methods; a class
      whose schema has loaded but which has never been instantiated has no
      generated aliases.
- [ ] `Core#init_internals` generates them, so every existing alias behaviour is
      unchanged from an instance's point of view.
- [ ] `base.trails.test.ts`, `model-schema-load-own-table-descendant.trails.test.ts`,
      `secure-token.test.ts` and `attributes.test.ts` stay green on all three lanes.
- [ ] `converge-alias-attribute-not-an-attribute-raise` is unblocked: with this
      landed, Rails' `ArgumentError` (`attribute_methods.rb:87-97`) can be added
      without reddening `attributes_test.rb:54`.
- [ ] `pnpm parity:api:calls` / `:args` deltas non-negative.
