---
title: "RouteSet: nest UrlHelper/OptimizedUrlHelper, port NamedRouteCollection#each, merge_defaults and the Config struct"
status: in-progress
updated: 2026-09-27
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: ["actionpack"]
deps: ["routing-route-class-has-no-rails-counterpart"]
deps-rfc: []
est-loc: 180
priority: 10
pr: trails#8184
claim: "2026-09-27T14:07:20Z"
assignee: "route-set-url-helper-nesting-config-struct-and-missing-members"
blocked-by: null
closed-reason: null
---

## Context

`parity:api --package actiondispatch --missing` (origin/main 9c8fe0b6c8) puts
`routing/route_set.rb` at 101/113 with 2 declaration-only rows. Apart from the
`generate_url_helpers` shape (its own story), the rows are:

**Nesting.** Rails nests `UrlHelper` in `NamedRouteCollection`, and
`OptimizedUrlHelper` in `UrlHelper` (`route_set.rb:190,205`). trails declares
both at module scope in `routing/route-set.ts` (`class UrlHelper`,
`class OptimizedUrlHelper extends UrlHelper`). So these are reported missing even
though trails has bodies for most of them:

- `NamedRouteCollection::UrlHelper`: `route_name` (`attr_reader`,
  `route_set.rb:203`), `handle_positional_args`, `create`, `optimize_helper?`
- `…::UrlHelper::OptimizedUrlHelper`: `arg_size`, `optimized_helper`,
  `parameterize_args`, `raise_generation_error`

**Missing members.**

- `NamedRouteCollection#each` (`route_set.rb:152`,
  `routes.each { |name, route| yield name, route }; self`)
- `CustomUrlHelper#merge_defaults` (private, `route_set.rb:709`). trails inlines
  the merge in `CustomUrlHelper#call`/`evalBlock`.
- `RouteSet::Config` is `Struct.new :relative_url_root, :api_only, :default_scope`
  (`route_set.rb:384`). trails has an `interface RouteSetConfig` plus
  `DEFAULT_CONFIG`, so `api_only`/`api_only=` are declaration-only.

## Acceptance criteria

- `UrlHelper` is reachable as `NamedRouteCollection.UrlHelper`, and
  `OptimizedUrlHelper` as `UrlHelper.OptimizedUrlHelper`, as in Rails. It has a
  public `routeName` reader.
- `NamedRouteCollection#each`, `CustomUrlHelper#mergeDefaults` and a
  `RouteSet.Config` struct-shaped class (three accessors, `new Config(...)`
  positional) are ported, and `RouteSet#config`/`apiOnly` read through it.
- The 12 missing plus 2 declaration-only rows above leave `routing/route_set.rb`'s
  report (the `generate_url_helpers` rows are out of scope here).
