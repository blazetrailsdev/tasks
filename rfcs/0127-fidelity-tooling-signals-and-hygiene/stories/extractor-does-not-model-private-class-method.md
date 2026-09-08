---
title: "extractor-does-not-model-private-class-method"
status: draft
updated: 2026-09-08
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The Ruby extractor (`scripts/api-compare/extract-ruby-api.rb`) models `private`
/ `protected` / `public` in all three of their forms — the bare visibility
switch (`process_fcall`/`process_vcall`, `:963-978`), the inline
`private def foo` and the retroactive `private(:foo, :bar)`
(`process_method_add_arg`, `:980-1000`, via `apply_visibility_to_named` at
`:1056`). It models none of `private_class_method`.

So a singleton method Rails explicitly privatises is recorded as public in
`rails-api.json`, and therefore absent from
`eslint/rails-private-methods.json`. Twelve sites in `vendor/rails/*/lib`
are affected, covering roughly forty names — `SchemaDumper.new`
(`activerecord/lib/active_record/schema_dumper.rb:11`),
`Naming.model_name_from_record_or_class`
(`activemodel/lib/active_model/naming.rb:349`),
`SchemaCache.read` (`schema_cache.rb:253`), and the association builders'
`macro` / `valid_options` / `define_callbacks` families
(`associations/builder/{association,belongs_to,has_many,has_one,collection_association,singular_association}.rb`).

Two lint rules read that manifest and both get the wrong answer:
`blazetrails/rails-private-jsdoc` does not require `@internal` where Rails is
private, and `blazetrails/unbacked-internal-needs-receipt` (RFC 0121) rejects
an `@internal` that is in fact backed. Surfaced by
`schema-cache-read-is-public-and-open-sets-an-encoding-rails-does-not` (#7631),
where tagging `SchemaCache.read` `@internal` — exactly what
`private_class_method :read` asks for — reds the reverse rule, and the tag
had to carry a `@noRailsEquivalent CONVERGEABLE` receipt pointing here
instead.

## Converged shape

Handle `private_class_method` / `public_class_method` in `process_command`
(`extract-ruby-api.rb:900-958`) the way the paren form of `private` is already
handled: collect the symbol arguments with `extract_symbol_args_from_paren`
and apply the visibility to the enclosing entity's `:classMethods` bucket.
`apply_visibility_to_named` (`:1056`) already picks a bucket — it just picks it
from `@in_sclass`, so it needs the bucket passed in rather than inferred.

Expect fallout: names that flip to private leave the measured surface, so
`parity:api` totals move and `rails-private-jsdoc` (autofixable) will want
`@internal` on the TS counterparts — the association builders are the bulk of
it. Land the extractor change and the resulting `@internal` sweep together,
then delete the `@noRailsEquivalent CONVERGEABLE` receipt on
`SchemaCache.read` (`packages/activerecord/src/connection-adapters/schema-cache.ts`).

## Acceptance criteria

- [ ] `private_class_method :foo` marks `foo` private in `rails-api.json`'s
      `classMethods`, and `public_class_method` marks it public.
- [ ] `eslint/rails-private-methods.json` lists `read` for
      `packages/activerecord/src/connection-adapters/schema-cache.ts`.
- [ ] The `@noRailsEquivalent CONVERGEABLE` receipt beside
      `SchemaCache.read`'s `@internal` is deleted and lint stays green.
- [ ] `pnpm parity:api` / `pnpm parity:api:extra:gate` reconciled, with the
      marks tightened rather than widened.
