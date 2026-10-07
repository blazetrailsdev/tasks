---
title: "activerecord: ConnectionAdapters.load is an awaited require split out of resolve"
status: draft
updated: 2026-10-07
rfc: "0180-activerecord-receipt-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails loads an adapter file inside `ConnectionAdapters.resolve`, with a synchronous
`require path_to_adapter` and a `rescue LoadError` around it
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters.rb:42-56`).

ESM has no synchronous `require`, so trails splits it: `ConnectionAdapters.load(adapterName)`
(`packages/activerecord/src/connection-adapters.ts`) awaits the dynamic `import()` and parks a
failure in the module-private `loadErrors` map, and the synchronous `resolve` re-raises the parked
error as Rails' two `LoadError` messages.

`database-config-validate-bang-makes-no-adapter-load-call` took the `load` call out of
`DatabaseConfig#validate!`, which is now Rails' body. The call sits in
`ConnectionHandler#resolvePoolConfig`
(`packages/activerecord/src/connection-adapters/abstract/connection-handler.ts`; Rails
`connection_adapters/abstract/connection_handler.rb:275-280`), the one step every
`establish_connection` already awaits before `validate!`, under an `@inventedArm load` receipt
pointing at this story. `load` itself carries `@noRailsEquivalent CONVERGEABLE` pointing here too.
`support/template-global-setup.ts` calls `load` directly because it builds a `PoolConfig` without a
handler.

No CLAUDE.md section ratifies an awaited `require`: § "Call-time constant resolution" covers a
constant named in a body, not a file loaded by registered path.

## Acceptance criteria

- [ ] Either `load` and `loadErrors` are gone and `resolve` is `connection_adapters.rb:26-66` line
      for line with the adapter module loaded by a mechanism that needs no separate awaited step,
      or the repo owner ratifies the awaited `require` in a CLAUDE.md section and both receipts
      become `PERMANENT` citing it.
- [ ] `ConnectionHandler#resolvePoolConfig` makes no call `resolve_pool_config` does not make, or its
      receipt is `PERMANENT` against that section.
- [ ] A plain-node import of a built standalone adapter entry still resolves.
