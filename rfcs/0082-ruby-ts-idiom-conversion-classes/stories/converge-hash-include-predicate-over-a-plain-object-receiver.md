---
title: "converge-hash-include-predicate-over-a-plain-object-receiver"
status: draft
updated: 2026-08-26
rfc: "0082-ruby-ts-idiom-conversion-classes"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Filed from PR #7103 (`group-attribute-methods-into-classmethods-instancemethods-modules`).

Grouping `packages/activemodel/src/attribute-methods.ts` into module objects
restored a pairing that a bodyless declaration had been winning, which surfaced
a real call-set omission that had been invisible:

Rails, `vendor/rails/activemodel/lib/active_model/attribute_methods.rb:541-543`:

```ruby
def attribute_method?(attr_name)
  respond_to_without_attributes?(:attributes) && attributes.include?(attr_name)
end
```

trails, `packages/activemodel/src/attribute-methods.ts` (`InstanceMethods.isAttributeMethod`):

```ts
return this.isRespondToWithoutAttributes("attributes") && Object.hasOwn(this.attributes, attrName);
```

`attributes` returns a plain JS object rather than a ported `Hash`, so there is
no `include?` to send and key existence is spelled `Object.hasOwn`. That is
baselined as one row in
`scripts/api-compare/call-mismatches-exclude/activemodel/attribute-methods.json`
(`attribute_method?` / `include?`) — a burndown ledger entry, not a settled
decision.

## Converged shape

Either:

- give the `Hash#include?` idiom a single ported spelling that api-compare maps
  (the same treatment the other `Hash` predicates get), and call it here — which
  retires this row and every sibling `include?` row across the exclude tree
  (`actiondispatch/routing/route-set.json`, `actioncontroller/metal/flash.json`,
  `rack/cascade.json`, `rack/urlmap.json`, all still carrying the seeded RFC 0047
  reason); or
- establish, with the Ruby cite, that a plain-object receiver has no `include?`
  counterpart at all and record the class ONCE as an idiom-conversion rule under
  this RFC, so individual call sites stop each carrying their own baseline row.

The second is only acceptable if the first is genuinely unavailable — a row that
converges by rule is still converged, a row that converges by re-justification is
not.

## Acceptance criteria

- The `attribute_method?` / `include?` row is gone from
  `scripts/api-compare/call-mismatches-exclude/activemodel/attribute-methods.json`,
  by convergence rather than by reseed.
- `pnpm parity:api:calls` green with a strictly smaller row count.
- If the rule route is taken, the sibling `include?` rows named above are
  retired in the same pass or explicitly scoped into a follow-up story.
