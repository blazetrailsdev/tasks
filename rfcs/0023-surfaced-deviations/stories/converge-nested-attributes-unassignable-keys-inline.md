---
title: "Inline attributes.except(*UNASSIGNABLE_KEYS) instead of the assignableNestedAttributes helper"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already converged: assignableNestedAttributes is gone; nested-attributes.ts:478 and :832 now inline except(attributes, ...UNASSIGNABLE_KEYS) at each call site as Rails does (nested_attributes.rb:408, 444, 525, 577)."
---

## Context

Surfaced by #6420 (RFC 0096 wave 2). One `naming` call-argument row in
`packages/activerecord/src/nested-attributes.ts`
(`assignNestedAttributesForCollectionAssociation`) resists renaming because a
trails-only helper stands where Rails inlines `Hash#except`.

Rails
(`vendor/rails/activerecord/lib/active_record/nested_attributes.rb:408,525`):

```ruby
UNASSIGNABLE_KEYS = %w( id _destroy )
...
association.reader.build(attributes.except(*UNASSIGNABLE_KEYS))
```

The same inline `attributes.except(*UNASSIGNABLE_KEYS)` appears at :444 and
:577. Rails has no named helper — the exclusion is expressed at each call
site, and the extractor therefore records the argument as `ref:except`.

trails routes all three through a module-level
`assignableNestedAttributes(attributes)` helper and passes its result as
`assignable`, giving `ruby ["ref:except"]` vs `ts ["ref:assignable"]`. The
helper is extra surface Rails does not have (CLAUDE.md: "If Rails inlines
something, inline it").

Converged shape: inline the exclusion at each of the three call sites — an
`except`-equivalent over `UNASSIGNABLE_KEYS` applied directly in the argument
position — and delete `assignableNestedAttributes`. If a shared helper is
genuinely required (e.g. because the TS `except` spelling is verbose enough to
hurt readability at three sites), it needs a `@noRailsEquivalent` receipt
rather than silent extra surface.

Interacts with `assertNestedAttributesAreKnown`, which currently consumes the
helper's output; check whether that call can take the inlined expression
without reintroducing the local.

## Acceptance criteria

- [ ] The three `attributes.except(*UNASSIGNABLE_KEYS)` sites
      (nested_attributes.rb:444,525,577) are inlined at the call site in the
      TS port, and `assignableNestedAttributes` is deleted or carries a
      `@noRailsEquivalent` reason.
- [ ] The `assignNestedAttributesForCollectionAssociation -> build` `naming`
      row drops out of `pnpm parity:api:calls:args:report`.
- [ ] `pnpm parity:api:extra --package activerecord` shows no new extra
      surface; `pnpm parity:api:calls` / `:args` green with no baseline row.
- [ ] Nested-attributes tests pass on all three adapters.
