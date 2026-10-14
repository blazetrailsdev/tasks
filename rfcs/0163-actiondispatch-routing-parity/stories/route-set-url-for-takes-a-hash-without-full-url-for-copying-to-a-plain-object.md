---
title: "RouteSet#url_for takes the Hash full_url_for builds; drop the eachPair copy"
status: in-progress
updated: 2026-10-14
rfc: "0163-actiondispatch-routing-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8890
claim: "2026-10-14T11:12:27Z"
assignee: "inlined-chain-with-own-and-same-file-initialize-is-skipped-as-ambiguous"
blocked-by: null
closed-reason: null
---

## Context

Rails' `full_url_for` Hash / `ActionController::Parameters` arm
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/url_for.rb:186-189`) is three lines:

```ruby
route_name = options.delete :use_route
merged_url_options = options.to_h.symbolize_keys.reverse_merge!(url_options)
_routes.url_for(merged_url_options, route_name)
```

`options.to_h` answers a `Hash` (a `HashWithIndifferentAccess` for `Parameters`), and that hash is
what `RouteSet#url_for` receives; `route_set.rb:857-858` opens with
`options = default_url_options.merge options` and then reads and deletes keys on it
(`:user`, `:password`, `:_recall`, `:original_script_name`, `route_set.rb:862-869`).

trails#8771 converged the first two lines but left one invented step. In
`packages/actionpack/src/action-dispatch/routing/url-for.ts:84-94` the result of `toH(options)` is
copied pair by pair into a fresh plain object before `reverseMergeBang`:

```ts
eachPair(toH<Record<string, unknown> | Hash<string, unknown>>(options), (key, value) => {
  mergedUrlOptions[key] = value;
});
reverseMergeBang(mergedUrlOptions, this.urlOptions());
return this._routes!.urlFor(mergedUrlOptions, ...);
```

The copy exists because `RouteSet#urlFor` (`packages/actionpack/src/action-dispatch/routing/route-set.ts`)
takes a plain-object `options` and reads it with property access, so a ruby-compat `Hash` /
`HashWithIndifferentAccess` (what `Parameters#toH` now answers) cannot be passed through. The
`eachPair` call and the intermediate object are calls Rails does not make. The same PR already
widened `handle_positional_args`' `innerOptions` to `Record | Hash` and reads it with `eachKey`
(`route_set.rb:` `inner_options.each_key`), which is the shape to extend.

This is the unfinished third acceptance criterion of
`full-url-for-flattens-parameters-to-h-through-an-invented-coercion`, which trails#8771 closed.

## Acceptance criteria

- `fullUrlFor`'s Hash / Parameters arm is Rails' three lines: delete `useRoute`, then
  `reverseMergeBang(toH(options), this.urlOptions())`, then `this._routes.urlFor(mergedUrlOptions, routeName)`.
  No `eachPair` copy and no intermediate plain object.
- `RouteSet#urlFor` accepts a plain object or a ruby-compat `Hash` for `options`, and performs
  `default_url_options.merge options` (`route_set.rb:858`) and its key reads / deletes
  (`route_set.rb:862-869`) through the ruby-compat hash functions (`merge`, `hashDelete`, `aref`)
  rather than property access, with no `instanceof Hash` arm added.
- The nested-`Parameters` routing test added in `route-set.trails.test.ts` by trails#8771 still
  passes, and a test routes a `HashWithIndifferentAccess` straight through `urlFor`.
- `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green with no new baseline row.
