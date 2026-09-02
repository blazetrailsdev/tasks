---
title: "activemodel: aliasAttributeMethodDefinition reroutes through defineAttributeMethodPattern, losing Rails' alias_attribute namespace"
status: done
updated: 2026-09-02
rfc: "0134-activemodel-surfaced-deviations"
cluster: rails-deviation
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 50
priority: 20
pr: 7396
claim: "2026-09-02T17:16:38Z"
assignee: "attribute-user-provided-default-slot-guard-invented-throw"
blocked-by: null
closed-reason: null
---

## Context

Rails `alias_attribute_method_definition`
(`vendor/rails/activemodel/lib/active_model/attribute_methods.rb:226-237`)
builds `method_name`/`target_name`/`mangled_name` itself and calls
`define_call(..., namespace: :alias_attribute, as: method_name)` directly — it
does NOT run the `define_method_*` hooks or the
`instance_method_already_implemented?` guard.

trails (`packages/activemodel/src/attribute-methods.ts:208-220`) delegates to
`defineAttributeMethodPattern(pattern, oldName, { owner, as: newName,
override: true })`, which runs both, and lands in namespace
`active_model_proxy_<target>` instead of `alias_attribute_<target>`.

Part of the reroute is a consequence of the ratified
generated-readers-are-properties rule (an alias READER must also be a
property, so the `defineMethodAttribute` hook has to fire for the plain-name
pattern) — but nothing at the site says so, and the non-reader patterns
(`_changed?`, `restore_*!`, …) could go through Rails' direct `define_call`
path with Rails' namespace. Converge as far as the properties rule allows and
cite the CLAUDE.md section for the remainder.

## Acceptance criteria

- Non-property alias patterns route through `defineCall` with
  `namespace: alias_attribute_*` exactly as attribute_methods.rb:236.
- The property-pattern remainder cites the "Generated attribute readers are
  properties" section at the site.
- `attribute-methods.test.ts` + `attributes.test.ts` alias coverage green;
  `pnpm parity:api:calls` green for the file.
