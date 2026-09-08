---
title: "checkout_and_verify's composition is inverted: the free function calls the module where Rails' module calls super"
status: draft
updated: 2026-09-08
rfc: "0119-connection-adapter-fidelity"
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

Surfaced while mixing `ConnectionPoolConfiguration` into `ConnectionPool`
(#7607). Rails' module overrides `checkout_and_verify` and calls `super` FIRST,
then seeds the connection's query cache
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/query_cache.rb:131-135`):

```ruby
def checkout_and_verify(connection)
  super
  connection.query_cache ||= query_cache
  connection
end
```

so `ConnectionPool#checkout_and_verify` (`abstract/connection_pool.rb`) is the
inner call and the query-cache seeding is the outer wrapper.

trails inverts the composition. `checkoutAndVerify` is a module-level FUNCTION
in `packages/activerecord/src/connection-adapters/abstract/connection-pool.ts`
taking the pool as its first argument, and it calls the mixin's method from
inside its own body:

```ts
if (typeof conn._runCheckoutCallbacks === "function") conn._runCheckoutCallbacks(cleanBlock);
else cleanBlock();
pool.checkoutAndVerify(c as unknown as QueryCacheHost);
```

PR #7607 changed only the receiver (`pool._cacheConfig.` → `pool.`, now that the
module's method lives on the pool) — the inversion is older than that PR and was
left in place as out of scope.

Two things follow from the inversion:

1. The pool's own `checkout_and_verify` body is not a method at all, so nothing
   can `super` into it, and a future adapter or mixin that needs to wrap
   checkout has no seam Rails' ancestry would have given it.
2. The free function is a name Rails has no counterpart for at file scope,
   sitting beside the method of the same name the mixin now installs — two
   `checkoutAndVerify`s in one file, meaning different things.

## Converged shape

Make the pool's own `checkout_and_verify` a method on `ConnectionPool`
(`abstract/connection_pool.rb`'s private section), and have the mixin's copy
call it through the ancestry — `include()` already splices the module below the
class, so the settled shape is the `prepend`-plus-`super_` helper from
`activesupport`'s `prepend.ts`, which hands the module's version the original as
an explicit `super_`. The free function then goes away, and the call at
`connection-pool.ts`'s checkout path becomes the plain
`this.checkoutAndVerify(conn)` Rails makes.

## Acceptance criteria

- [ ] `checkoutAndVerify` exists as a method on `ConnectionPool`, not a
      pool-taking free function.
- [ ] The query-cache seeding wraps it the way `query_cache.rb:131-135` wraps
      `super`, rather than being called from inside it.
- [ ] `pnpm parity:api:extra:gate` does not grow; the duplicate file-scope name
      is gone.
- [ ] Connection-pool, query-cache and transactional-fixture suites green on all
      three adapters.
