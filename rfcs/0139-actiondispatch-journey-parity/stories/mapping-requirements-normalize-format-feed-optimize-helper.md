---
title: "mapping-requirements-normalize-format-feed-optimize-helper"
status: draft
updated: 2026-09-26
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `Mapper::Mapping#initialize`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/mapper.rb:162-178`)
splits constraints with `split_constraints`, merges
`normalize_format(formatted)[:requirements]` (`:259-273`, which is
`{ format: /.+/ }` for `format: true`, the regexp for a Regexp and
`Regexp.compile` for a String) into `@requirements`, and hands them to
`Journey::Path::Pattern.new(ast, @requirements, ...)`. So `route.path.requirements`
contains the format requirement.

trails' `Mapping` (`packages/actionpack/src/action-dispatch/routing/mapper.ts`)
has no `@requirements`, `split_constraints` or `normalize_format`. It passes
`format: this._formatted` to the routing `Route`, which keeps only
`formatted = options.format !== false`. The routing `Route` also keeps its path
as a string, not a `Journey::Path::Pattern`.

That leaves `UrlHelper.isOptimizeHelper` (`route-set.ts`, the port of
`route_set.rb:199-201` `route.path.requirements.empty? && !route.glob?`)
reading `route.pathConstraints`, which misses the format requirement. The
result is that a `format: true` route picks `OptimizedUrlHelper` where Rails picks the generic helper.

## Acceptance criteria

- `Mapping` computes `@requirements` via `split_constraints` + `normalize_format` as `mapper.rb:162-167` does, and the routing `Route` exposes them as its path requirements.
- `UrlHelper.isOptimizeHelper` reads those requirements, and the `@missingRailsCall requirements` receipt in `route-set.ts` is deleted.
- A `format: true` named route uses the generic `UrlHelper`, as in Rails.
