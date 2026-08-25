---
title: "The adapter proxy answers undefined for a name no adapter defines; Ruby raises NoMethodError"
status: done
updated: 2026-08-09
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: 6273
claim: "2026-08-09T02:00:45Z"
assignee: "fixture-teardown-has-no-delete-rails-deletes-at-next-load"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while shipping `adapter-proxy-trap-carves-out-string-probe-keys` (PR #6267).

That story deleted `ADAPTER_PROXY_PROBE_KEYS` and its doc block, so
`ConnectionPool#_getAdapterProxy`'s trap
(`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts`)
now consults no string-key set: only `typeof prop === "symbol"` reads through,
the one carve-out the language forces, matching what
`nullpool-trap-carves-out-string-probe-keys` (PR #6261) did to `NullPool`.

**The second half of the same divergence survives, and it is now the only one
left.** The trap decides whether to dispatch by testing the name against a
sample object:

```ts
const sample = pool.activeConnection ?? pool.connections[0] ?? AbstractAdapter.prototype;
if (typeof (sample as any)[prop] !== "function") return undefined;
```

A name no adapter defines therefore answers **`undefined`**. Ruby dispatches it
and the adapter raises `NoMethodError` — `AbstractAdapter`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb`)
overrides no `method_missing`, exactly as `NullPool` does not
(`abstract/connection_pool.rb:14-51`). `NullPool`'s trap already raises for this
case (`connection-pool.ts`, the `NoMethodError` arm); the adapter proxy silently
answers a non-callable, so a typo'd adapter method on a pool-held proxy reads as
"absent" rather than raising where Rails raises.

Two sub-parts, both trails inventions with no Rails counterpart:

- The `AbstractAdapter.prototype` stand-in, which exists so a name resolves the
  same way before and after the first checkout. Ruby needs no stand-in: the
  adapter's class is known without a connection.
- The `constructor` arm, which answers `(sample as any).constructor` because
  `constructor` is JS object plumbing a walker reads to name a class, not a Ruby
  send — dispatching it would call the adapter class without `new`.

The stated reason for answering `undefined` rather than raising is the same
test-harness constraint the deleted key set had: the proxy is reachable from any
translated error via its `connectionPool`, so a serializer walking it must not
be handed something that throws. That is a harness constraint, not a language
shortcoming, which is why this is a ledger row and not a ratified deviation —
and the merged sibling already showed the shape of the answer: keep serializers
off the object rather than make the object answer probes.

Note `_getAdapterProxy` currently has no non-test callers on `main`; its
consumers are expected back through
`check-current-protected-environment-pool-migration-context-blocked-on-adapter-proxy`
and the `migration-collaborators-hold-a-pool` line, so this should be converged
before they land rather than after.

## Converged shape

- A string key the adapter has no method for raises `NoMethodError` with
  `AbstractAdapter`'s class name in the message, as `NullPool`'s trap does for
  its own.
- The `typeof prop === "symbol"` carve-out stays — a JS `Symbol` cannot spell a
  Ruby send.
- The `pool` and `adapterName` data-property arms stay; they mirror
  `abstract_adapter.rb:153`'s `@pool` and are not sends.
- Whatever walker then reaches a bare proxy is fixed at the walker, not by
  softening the trap.
- The `AbstractAdapter.prototype` stand-in and the `constructor` arm are
  re-derived against the raising shape and deleted if the raise subsumes them.

## Acceptance criteria

- [ ] `proxy.someNameNoAdapterDefines` raises `NoMethodError`, not `undefined`.
- [ ] A deliberately failing assertion whose subject holds an adapter proxy
      still reports its own failure, not an error from the reporter — the guard
      `connection-pool.test.ts` now carries.
- [ ] `AbstractAdapter.prototype` no longer stands in for a sample connection,
      or its remaining use is justified at the call site.
- [ ] No new baseline rows or allowlist entries.
