---
title: "Ruby flatten is deep, not flat(): fix permit! and assert_routing's non-mutating options rebind"
status: draft
updated: 2026-08-31
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

Two divergences surfaced while converging these bodies in PR #7313 (RFC 0129);
both are outside that PR's flagged population and neither is language-forced.

**1. `flatten` is deep; `Array.prototype.flat()` is depth-1.**
`Parameters#permit!` (`actionpack/lib/action_controller/metal/strong_parameters.rb:461-470`):

```ruby
each_pair do |key, value|
  Array.wrap(value).flatten.each do |v|
    v.permit! if v.respond_to? :permit!
  end
end
```

`packages/actionpack/src/action-controller/metal/strong-parameters.ts:122-134`
spells `Array.wrap(value).flatten` as
`Array.isArray(value) ? value.flat() : [value]`. Ruby's `flatten` with no
argument recurses to any depth (`vendor/ruby/array.c`, `rb_ary_flatten`); JS
`flat()` defaults to depth 1. A `Parameters` nested two arrays deep is never
marked permitted, where Rails marks it. This is the `Array#flatten` instance of
the idiom class this RFC enumerates.

**2. `assert_routing` mutates the caller's hash; the port copies it.**
`actionpack/lib/action_dispatch/testing/assertions/routing.rb:255-258`:

```ruby
if controller && controller.include?(?/) && default_controller && default_controller.include?(?/)
  options[:controller] = "/#{controller}"
end
```

`packages/actionpack/src/action-dispatch/testing/assertions/routing.ts:187`
writes `options = { ...options, controller: `/${controller}` }` — a rebind, so
the caller's hash is left unchanged where Rails leaves it rewritten. The
subsequent `assert_generates` sees the same value either way, so no test
distinguishes them today; the divergence is visible to a caller that reads its
own hash afterwards.

## Converged shape

1. Ruby `flatten` (no depth argument) is `flat(Infinity)`. Apply it at this call
   site and at any sibling the sweep finds.
2. Mutate `options` in place, as Rails does.

## Acceptance criteria

- `permit!` recurses to any depth; a regression test covers a `Parameters`
  nested two arrays deep and FAILS on the current baseline.
- `assert_routing` mutates `options` rather than rebinding it.
- `pnpm parity:api:calls` / `:calls:args` unchanged; actionpack suite green with
  no test-name change.
