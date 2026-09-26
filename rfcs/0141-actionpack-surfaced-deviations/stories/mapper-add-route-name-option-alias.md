---
title: "Mapper#addRoute accepts an invented name: alias for :as (mapper.rb:2052-2056)"
status: draft
updated: 2026-09-26
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `add_route` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/mapper.rb:2052-2056`)
reads the route name from `:as` only:

```ruby
as = if !options.fetch(:as, true)
  options.delete(:as)
else
  name_for_action(options.delete(:as), action)
end
```

trails' private `Mapper#addRoute`
(`packages/actionpack/src/action-dispatch/routing/mapper.ts`) computes
`asGiven = options.as !== undefined ? options.as : options.name`. `name:` is a
trails-invented alias for `:as`, and Rails has no `name` route option. trails#8155
converged the rest of that computation onto `nameForAction`, but left the alias.

## Acceptance criteria

- `addRoute` reads only `options.as`, mirroring `mapper.rb:2052-2056`.
- Every caller and test that passes `name:` to a mapper DSL method passes `as:`
  instead. `Route`'s own `name` field, the built route's name, is unaffected.
