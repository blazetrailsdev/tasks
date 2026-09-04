---
title: "cache/store.ts's file-local Object#inspect retires onto ruby-compat's rbInspect (cache.rb:217)"
status: claimed
updated: 2026-09-04
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: 17
pr: null
claim: "2026-09-04T17:20:47Z"
assignee: "sync-reads-of-async-reflection-retire-with-rfc-0073"
blocked-by: null
closed-reason: null
---

## Context

`retrieve_pool_options` raises at
`vendor/rails/activesupport/lib/active_support/cache.rb:217`:

```ruby
raise TypeError, "Invalid :pool argument, expected Hash, got: #{pool_options.inspect}"
```

— Ruby's `Object#inspect`. trails spells that with a file-local partial
re-implementation, `packages/activesupport/src/cache/store.ts:26-31`:

```ts
/** Mirrors Ruby `Object#inspect` for the values `retrieve_pool_options` reports. */
function inspect(value: unknown): string {
  if (typeof value === "string") return JSON.stringify(value);
  if (value === null || value === undefined) return "nil";
  return String(value);
}
```

`@blazetrails/ruby-compat` already exports `rbInspect`, the real port of
`rb_inspect` (`vendor/ruby/object.c:704`), covering nil, booleans, Integer and
Float, Symbol, String, Array and Hash — where the local one collapses an Array
or Hash to `String(value)` and so reports `[object Object]` for exactly the
wrong-type argument this message exists to describe.

This is the last file-local copy in `cache/store.ts`. Its two siblings are
already retired: `Kernel#Float` by
[[consolidate-kernel-integer-and-float-conversions]] and `Kernel#Integer` by
[[move-kernel-integer-to-ruby-compat]] (#7433), which also deleted the
`rubyClassName` helper. Both of those stories are `done`, so nothing owns this
leftover — hence its own story.

## Converged shape

Import `rbInspect` from `@blazetrails/ruby-compat`, use it at
`store.ts`'s throw site, and delete the local `inspect`. Nothing else in the
file calls it.

## Acceptance criteria

- [ ] `packages/activesupport/src/cache/store.ts` declares no local `inspect`;
      the `Invalid :pool argument` message interpolates `rbInspect`.
- [ ] A Hash or Array `:pool` argument reports Ruby's `inspect` text rather
      than `[object Object]`.
- [ ] `packages/activesupport/src/cache/store-pool-options.trails.test.ts`
      passes, extended with the Array/Hash case that motivates the change.
- [ ] `pnpm parity:api:extra --package activesupport` shows no new novel surface.
