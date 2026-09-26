---
title: "index.ts re-exports the this-typed acceptsNestedAttributesFor as a receiverless package function"
status: draft
updated: 2026-09-26
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8128 converged `accepts_nested_attributes_for` onto the `this`-typed
mixin shape (`packages/activerecord/src/nested-attributes.ts`,
`export function acceptsNestedAttributesFor(this: typeof Base, ...attrNames)`),
assigned onto `Base` as `static acceptsNestedAttributesFor = …`, matching Rails'
`NestedAttributes::ClassMethods#accepts_nested_attributes_for`
(`activerecord/lib/active_record/nested_attributes.rb:351-372`).

`packages/activerecord/src/index.ts` still re-exports it as a top-level
package export (`export { acceptsNestedAttributesFor, REJECT_ALL_BLANK_PROC,
TooManyRecords } from "./nested-attributes.js"`). Rails has no module-level
`accepts_nested_attributes_for`: it is only reachable as a class method on a
model. The export now has a `this` parameter, so a consumer calling
`acceptsNestedAttributesFor(Model, "x")` (the pre-#8128 shape) gets a type
error, and a bare call has no receiver.

## Acceptance criteria

- `index.ts` no longer re-exports `acceptsNestedAttributesFor`. The only public
  path is `Model.acceptsNestedAttributesFor(...)`, as in Rails.
- Any in-repo consumer of the package-level export (grep across `packages/`,
  `website/`, docs examples) calls it through the model class instead.
- `pnpm parity:api:extra:gate` stays green.
