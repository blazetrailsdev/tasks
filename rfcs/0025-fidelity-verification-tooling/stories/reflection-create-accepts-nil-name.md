---
title: "reflection-create-accepts-nil-name"
status: done
updated: 2026-07-19
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4975
claim: "2026-07-19T22:11:09Z"
assignee: "reflection-create-accepts-nil-name"
blocked-by: null
closed-reason: null
---

## Context

`Reflection.create` in Rails accepts a nil `name`:

```ruby
# vendor/rails/activerecord/test/cases/reflection_test.rb:126
reflection = ActiveRecord::Reflection.create(
  :has_many, nil, nil, { class_name: "MyApplication::Business::Company" }, Customer
)
```

Our port (`packages/activerecord/src/reflection.ts:2242`) types `name` as
`string`, so the ported test in
`packages/activerecord/src/reflection.test.ts` (`reflection klass for nested
class name`, added by PR #4973) needs a
`null as unknown as string` cast to express the Rails call.

The runtime already tolerates a null name — the test passes — so this is a
type-signature divergence only, not a behavioral one. Note that
`MacroReflection`'s constructor eagerly computes `pluralName` from `name`,
whereas Rails puts `plural_name` on `AssociationReflection`
(`vendor/rails/activerecord/lib/active_record/reflection.rb:517`) — worth
checking whether that eagerness is a second, related divergence while in
here.

## Acceptance criteria

- `create` / `MacroReflection` accept a nil name the way Rails does, without
  callers needing a cast.
- The cast and its explanatory comment are removed from
  `reflection.test.ts`.
- Confirm or rule out the eager-`pluralName` divergence noted above; if it is
  one, either fix it here or register it separately.
- No test renamed; existing reflection tests stay green.
