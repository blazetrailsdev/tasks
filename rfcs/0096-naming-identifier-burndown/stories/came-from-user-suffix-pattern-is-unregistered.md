---
title: "came-from-user-suffix-pattern-is-unregistered"
status: in-progress
updated: 2026-08-21
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6814
claim: "2026-08-21T11:39:43Z"
assignee: "came-from-user-suffix-pattern-is-unregistered"
blocked-by: null
closed-reason: null
---

## Context

`AttributeMethods::BeforeTypeCast` registers TWO suffix groups on include
(`activerecord/lib/active_record/attribute_methods/before_type_cast.rb:32-33`):

```ruby
attribute_method_suffix "_before_type_cast", "_for_database", parameters: false
attribute_method_suffix "_came_from_user?", parameters: false
```

PR #6779 (`generate-concrete-attribute-methods-is-a-second-generation-path`)
converged the first line: `Base._attributeMethodPatterns` now carries
`BeforeTypeCast` / `ForDatabase` patterns with `parameters: false`, so those
readers come from the pattern machinery under the generator's namespace.

The second line is still unported. trails has the proxy target's body —
`isAttributeCameFromUser` / the prototype's `cameFromUser(attrName)`
(`packages/activerecord/src/attribute-methods/before-type-cast.ts:87`,
`packages/activerecord/src/base.ts:3848`) — but no per-attribute generated
method, so Rails' `topic.title_came_from_user?` has no trails spelling.

## Converged shape

Register the third suffix beside the other two in `Base._attributeMethodPatterns`
(base.ts), so `define_attribute_method_pattern` generates a per-attribute
`titleCameFromUser` reader through `defineProxyCall` → `defineCall`'s
`parameters === false` arm (a zero-arg reader is an accessor property in TS,
per CLAUDE.md "Generated attribute readers are properties").

The pattern's `proxyTarget` is `attributeCameFromUser`, so the instance method
the generated reader delegates to has to exist at that name — today the body is
spelled `cameFromUser`. Check the Ruby name (`attribute_came_from_user?`,
before_type_cast.rb:64-66) against `docs/ruby-ts-conventions.md` and land the
proxy target under the name that table produces.

## Acceptance criteria

- [ ] `Base._attributeMethodPatterns` carries the `_came_from_user?` suffix with
      `parameters: false`, mirroring before_type_cast.rb:33.
- [ ] A per-attribute `<attr>CameFromUser` reader is generated for every
      attribute name, from the pattern — not installed inline.
- [ ] The proxy target resolves to the ported `attribute_came_from_user?` body.
- [ ] `pnpm parity:api:calls` / `:args` add zero rows.
