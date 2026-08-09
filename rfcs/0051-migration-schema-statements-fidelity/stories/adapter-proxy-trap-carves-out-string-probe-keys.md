---
title: "The adapter proxy's trap still carves out ADAPTER_PROXY_PROBE_KEYS string names; Ruby dispatches or raises for them"
status: done
updated: 2026-08-09
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6267
claim: "2026-08-09T00:45:54Z"
assignee: "date-state-julian-only-spellings-unbuildable"
blocked-by: null
closed-reason: null
---

## Context

`nullpool-trap-carves-out-string-probe-keys` (PR #6261) converged `NullPool`'s
`get` trap to the single language-forced Symbol carve-out: string keys now raise
`NoMethodError`, matching Ruby's `NullPool`
(`activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:14-51`,
which defines a fixed member set and overrides no `method_missing`).

The **other half of the same deviation survives**, deliberately out of that
story's scope. `ConnectionPool#_getAdapterProxy`
(`connection-adapters/abstract/connection-pool.ts:531-545`) still reads the
dozen string names in `ADAPTER_PROXY_PROBE_KEYS` (`:86-110`: `then`, `catch`,
`finally`, `toJSON`, `toString`, `valueOf`, `inspect`, `asymmetricMatch`,
`$$typeof`, `_isMockFunction`, `getMockName`, `nodeType`, `nodeName`,
`tagName`, `constructor`, `prototype`, `hasOwnProperty`) through to `undefined`
rather than dispatching them.

Most of those are Ruby sends. `adapter.then` is a `NoMethodError` in Ruby and
`undefined` here. Two (`inspect`, `to_s`) are `Object` members Ruby answers, so
those two are not deviations — `AbstractAdapter#inspect` is a real method
(`abstract_adapter.rb:174-179`), ported at `abstract-adapter.ts:1428`.

The carve-out's stated reason (`connection-pool.ts:74-85`) is that the proxy is
reachable from any translated error via its `connectionPool`, so a probe that
got a fabricated callable would dispatch to a raw connection with no such
method. That is a test-harness/serializer constraint, not a language
shortcoming — which is why this is a ledger row and not a ratified deviation.

The now-merged sibling shows the shape of the answer: the fix is to keep
serializers off the object, not to make the object answer probes.
`connection-pool-adapter-proxy-serialization-probe-safety` (0023, done) is the
story that originally _added_ the set; it is debt, not permission.

## Converged shape

- `_getAdapterProxy`'s trap consults no string-key set. Only `typeof prop ===
"symbol"` reads through — a JS `Symbol` cannot spell a Ruby send, the one
  carve-out the language forces.
- The `pool` and `adapterName` data-property arms stay (`:537-544`); they mirror
  `abstract_adapter.rb:153`'s `@pool` and are not probes.
- Any walker that still reaches a bare proxy is fixed at the walker.
- `ADAPTER_PROXY_PROBE_KEYS` and its doc block are deleted once the last reader
  is gone.

## Acceptance criteria

- [ ] `ADAPTER_PROXY_PROBE_KEYS` has no readers and is deleted.
- [ ] `adapter.then` / `adapter.toJSON` on the proxy dispatch or raise as the
      Ruby send would, rather than answering `undefined`.
- [ ] A deliberately failing assertion whose subject holds an adapter proxy
      still reports its own failure, not an error from the reporter
      (the guard `connection-pool.trails.test.ts` now carries for `NullPool`).
- [ ] No new baseline rows or allowlist entries.
