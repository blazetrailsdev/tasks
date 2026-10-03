---
title: "activemodel: inline generate_method and take parameters: as a kwarg in attribute_method_prefix/suffix"
status: in-progress
updated: 2026-10-03
rfc: "0173-activemodel-parity-100"
cluster: receipts
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8443
claim: "2026-10-03T11:25:20Z"
assignee: "attribute-methods-inline-generate-method-and-affix-parameters"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `activemodel-audit-permanent-receipts-root`. `packages/activemodel/src/attribute-methods.ts`
carries two module-private helpers Rails inlines, each under a `@noRailsEquivalent PERMANENT` receipt
the extractor never reads (`pnpm parity:api:receipts --package activemodel` lists both as
unverifiable):

- `generateMethodFor(pattern)` — Rails spells it as one local in `define_attribute_method_pattern`:
  `generate_method = "define_method_#{pattern.proxy_target}"`
  (`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_methods.rb:333`), then
  `respond_to?(generate_method, true)` / `send(generate_method, …)` (`:335-336`). The helper exists
  because `aliasAttributeMethodDefinition` reads the same name in an arm
  `alias_attribute_method_definition` (`attribute_methods.rb:226-237`) does not have.
- `extractParameters(affixes)` — pops a trailing `{ parameters }` off the rest arguments of
  `attributeMethodPrefix` / `attributeMethodSuffix`, where Rails declares
  `(*prefixes, parameters: nil)` / `(*suffixes, parameters: nil)` (`attribute_methods.rb:106,140`).

CLAUDE.md "Decomposition": if Rails inlines something, inline it. § "Generated attribute readers are
properties" ratifies the `define_method_attribute` hook itself, not a helper that names it.

## Acceptance criteria

- [ ] `defineAttributeMethodPattern` holds the `generateMethod` local and asks `rbObjRespondTo(this, generateMethod, true)` / `rbFSend` as `:333-336` does; `generateMethodFor` is deleted.
- [ ] `aliasAttributeMethodDefinition` mirrors `:226-237` line for line, or its extra arm is cited to § "Generated attribute readers are properties" at the call site.
- [ ] `attributeMethodPrefix` / `attributeMethodSuffix` take `parameters` through the settled kwargs idiom; `extractParameters` is deleted.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:arms:report --package=activemodel` do not grow.

## Verification

```bash
pnpm parity:api:calls && pnpm parity:api:calls:args && pnpm vitest run packages/activemodel/src/attribute-methods.test.ts
```
