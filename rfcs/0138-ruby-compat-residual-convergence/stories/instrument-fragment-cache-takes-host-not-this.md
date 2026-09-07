---
title: "instrument_fragment_cache takes the receiver as a leading argument and invents two fallbacks"
status: draft
updated: 2026-09-07
rfc: "0138-ruby-compat-residual-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 110
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`instrument_fragment_cache` is an ordinary instance method of
`AbstractController::Caching::Fragments`
(`vendor/rails/actionpack/lib/abstract_controller/caching/fragments.rb:144-146`):

```ruby
def instrument_fragment_cache(name, key, &block) # :nodoc:
  ActiveSupport::Notifications.instrument("#{name}.#{instrument_name}", instrument_payload(key), &block)
end
```

Two parameters plus a block, and `instrument_name` / `instrument_payload` are
called unqualified on `self` — they are supplied by
`ActionController::Caching`
(`vendor/rails/actionpack/lib/action_controller/caching.rb:41-47`), which is
included alongside.

`packages/actionpack/src/abstract-controller/caching/fragments.ts:133-142` takes
the receiver as an extra LEADING parameter instead:

```ts
export function instrumentFragmentCache<T>(
  host: FragmentsHost,
  name: string,
  key: unknown,
  block: () => T,
): T;
```

and reaches the two collaborators through optional chaining with fallbacks
Rails has no counterpart for:

```ts
const ns = host.instrumentName?.() ?? "abstract_controller";
const payload = host.instrumentPayload?.(key) ?? { key };
```

`"abstract_controller"` and `{ key }` are invented values: in Rails a host that
does not answer `instrument_name` raises `NoMethodError`, it does not silently
namespace the event differently. The four callers in the same file
(`fragments.rb:83,95,106,118`) pass `this` explicitly as a result.

Surfaced while converging the receiver of `cache_configured?` / `cache_store`
in PR #7590; out of scope there because it changes a signature and its four
call sites rather than a receiver.

## Converged shape

`instrumentFragmentCache(this: FragmentsHost, name: string, key: unknown,
block: () => T)` — a `this`-typed function like every other member of the file,
called as `instrumentFragmentCache.call(this, name, key, block)`. The two
collaborator reads lose their `??` fallbacks so an unequipped host fails loud,
as `NoMethodError` does in Ruby.

## Acceptance criteria

- [ ] `instrumentFragmentCache` declares Rails' two parameters plus the block,
      with the receiver as `this`, not a leading `host` argument.
- [ ] The `"abstract_controller"` and `{ key }` fallbacks are gone; the body
      calls `this.instrumentName()` and `this.instrumentPayload(key)`.
- [ ] The four call sites in `fragments.ts` and the barrel re-export follow.
- [ ] `pnpm parity:api:params` and `pnpm parity:api:calls:args` stay green.
