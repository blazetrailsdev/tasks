---
title: "full-url-for-flattens-parameters-to-h-through-an-invented-coercion"
status: done
updated: 2026-10-11
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8771
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::Routing::UrlFor#full_url_for`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/url_for.rb:182-202`)
handles `Hash, ActionController::Parameters` in one arm:

```ruby
route_name = options.delete :use_route
merged_url_options = options.to_h.symbolize_keys.reverse_merge!(url_options)
_routes.url_for(merged_url_options, route_name)
```

trails' `fullUrlFor` (`packages/actionpack/src/action-dispatch/routing/url-for.ts:64-88`)
goes through an invented `coerceHashOrParameters` helper (`url-for.ts:150-154`).
Since `Parameters#toH` answers a `HashWithIndifferentAccess` (trails PR for
`parameters-to-h-returns-a-plain-object-not-hash-with-indifferent-access`),
that helper flattens it with `Object.fromEntries(value.toH())` because the
body below it reads a plain object (`delete asHash["useRoute"]`,
`{ ...asHash }`), and `RouteSet#urlFor` downstream reads its options with
`Object.hasOwn` / property access. The flattening is shallow: a nested hash in
the options stays a `HashWithIndifferentAccess`.

Also: Rails deletes `:use_route` from `options` itself (the caller's
`Parameters` / Hash is mutated); trails deletes it from the converted copy
when the argument is a `Parameters`.

## Acceptance criteria

- [ ] `fullUrlFor`'s `Hash, ActionController::Parameters` arm is Rails' three
      lines: `hashDelete(options, "useRoute")` on the argument itself, then
      `to_h` / `reverse_merge!(url_options)` read through ruby-compat calls
      that answer a plain object and a `Hash` alike.
- [ ] `coerceHashOrParameters` is deleted.
- [ ] `RouteSet#urlFor` (and `define_url_helper`'s `options = args.pop.to_h`,
      `route_set.rb:340-350`) accept the `Hash` without a flattening step.
