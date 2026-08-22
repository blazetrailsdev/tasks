---
title: "Call-set extractor does not pair an AR method that overrides a same-named ActiveModel one"
status: draft
updated: 2026-08-22
rfc: "0025-fidelity-verification-tooling"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# Call-set extractor does not pair an AR method that overrides a same-named ActiveModel one

## Context

Found while converging `generate_alias_attribute_methods` in PR #6838.

`packages/activerecord/src/attribute-methods.ts#generateAliasAttributeMethods`
omitted FOUR of the five calls Rails' body makes
(`activerecord/lib/active_record/attribute_methods.rb:80-85`):

    def generate_alias_attribute_methods(code_generator, new_name, old_name)
      attribute_method_patterns.each do |pattern|
        alias_attribute_method_definition(code_generator, pattern, new_name, old_name)
      end
      attribute_method_patterns_cache.clear
    end

`pnpm parity:api:calls` was GREEN throughout. The extractor never pairs that TS
function with `attribute_methods.rb:80`, so `attribute_method_patterns`,
`each`, `attribute_method_patterns_cache` and `clear` were outside the measured
population. Confirmed directly: adding
`@missingRailsCall attribute_method_patterns` / `attribute_method_patterns_cache`
receipts at the call site made the gate fail with **STALE tag** for both, i.e.
the tool believes no such call was ever flagged there.

The likely cause is that the same method name exists in BOTH gems —
`activemodel/lib/active_model/attribute_methods.rb:217` and
`activerecord/lib/active_record/attribute_methods.rb:80`, where the AR one
overrides the AM one — and the TS side lives in
`packages/activerecord/src/attribute-methods.ts` while carrying the AR arity
(3 params: `code_generator, new_name, old_name`) that the AM definition also
has. `output/rails-api.json` contains both definitions.

This is a measurement hole, not a one-off: every ActiveRecord override of a
same-named ActiveModel method is a candidate. `alias_attribute_method_definition`
(`activemodel:217` / `activerecord:87`) and
`eagerly_generate_alias_attribute_methods` (`activemodel:211` /
`activerecord:76`) are in exactly the same position.

## Converged shape

Resolve the Ruby counterpart by the TS file's OWNING GEM first, so a method in
`packages/activerecord/src/**` pairs against the `activerecord/` definition and
only falls back to another gem when that gem has none. Then confirm the fix by
reverting `generateAliasAttributeMethods` to its pre-#6838 shape (one call, no
cache clear) and checking the gate goes RED.

Audit the same-name AR-overrides-AM set afterwards; the newly-paired methods
will surface pre-existing divergence that must be converged or given reviewed
baseline rows (hand-added via `serializeBaseline`, never `--write`).

## Acceptance criteria

- [ ] A TS method under `packages/<pkg>/src/**` pairs against `<pkg>`'s Ruby
      definition when one exists, before any other gem's same-named definition.
- [ ] Reverting `generateAliasAttributeMethods` to a single
      `aliasAttributeMethodDefinition` call with no cache clear makes
      `pnpm parity:api:calls` RED.
- [ ] Any rows the re-pairing surfaces are converged, or carry a reviewed
      one-line reason / `@missingRailsCall` receipt.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
