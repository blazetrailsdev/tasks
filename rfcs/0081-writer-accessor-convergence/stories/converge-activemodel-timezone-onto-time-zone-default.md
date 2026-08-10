---
title: "converge-activemodel-timezone-onto-time-zone-default"
status: done
updated: 2026-07-27
rfc: "0081-writer-accessor-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5402
claim: "2026-07-27T13:33:06Z"
assignee: "converge-activemodel-timezone-onto-time-zone-default"
blocked-by: null
closed-reason: null
---

## Context

Found by the `audit-setx-functions-without-rails-counterpart` audit.

`packages/activemodel/src/type/helpers/timezone.ts:26` exports
`setDefaultTimezone`, a genuine trails-only seam: Rails'
`ActiveModel::Type::Helpers::Timezone`
(`vendor/rails/activemodel/lib/active_model/type/helpers/timezone.rb:10-19`)
derives everything from `::Time.zone_default` and exposes NO setter at all.

```ruby
def is_utc?
  if default = ::Time.zone_default
    default.name == "UTC"
  else
    true
  end
end
```

Trails has no `Time.zone_default`, so the module holds its own
`_defaultTimezone` binding, and activerecord's
`type/internal/timezone.ts:25` pushes into it to keep the two in lockstep.
That cross-package push is the deviation: in Rails the two layers agree because
they read one shared piece of ActiveSupport state, not because one writes the
other.

## Acceptance criteria

- A `Time.zone_default` (or the minimal equivalent) exists in
  `@blazetrails/activesupport`, and `is_utc?` / `default_timezone` in
  activemodel derive from it exactly as Rails does.
- `setDefaultTimezone` in `activemodel/src/type/helpers/timezone.ts` is deleted,
  along with the `setActiveModelTimezone` forwarding call in
  `activerecord/src/type/internal/timezone.ts`.
- `configuredTimezone()` keeps working for the non-UTC arm.
- Existing activemodel and activerecord timezone/time-type tests pass with
  names unchanged; `pnpm parity:api:extra` shows one fewer activemodel extra.
