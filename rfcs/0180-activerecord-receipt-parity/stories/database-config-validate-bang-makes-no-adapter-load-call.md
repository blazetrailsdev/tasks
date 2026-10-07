---
title: "activerecord: DatabaseConfig#validate! makes no adapter load call"
status: ready
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

`DatabaseConfig#validate!` is `adapter_class if adapter; true`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/database_configurations/database_config.rb:29-33`),
and the adapter file is loaded inside `ConnectionAdapters.resolve` by a synchronous
`require path_to_adapter` (`connection_adapters.rb:42-44`).

trails splits that in two (trails#8612): `ConnectionAdapters.load(adapterName)`
(`packages/activerecord/src/connection-adapters.ts:20-33`) awaits the dynamic `import()` and parks a
failure in `loadErrors`, and the synchronous `resolve` re-raises it. So
`packages/activerecord/src/database-configurations/database-config.ts` `validateBang` is async and
makes a call Rails does not: `await ConnectionAdapters.load(this.adapter)`. It carries
`@inventedArm load`, tagged `PERMANENT`, and `load` itself carries `@noRailsEquivalent PERMANENT`.
No CLAUDE.md section ratifies an async `require`; § "Call-time constant resolution" covers constants
named in a body, not a file loaded by registered path. The audit in
`activerecord-audit-permanent-receipts-subsystems-part-2` re-tagged the `validateBang` receipt
`CONVERGEABLE database-config-validate-bang-makes-no-adapter-load-call`.

## Acceptance criteria

- [ ] `validateBang`'s body is `if (this.adapter != null) this.adapterClass(); return true`, with no
      `load` call and no `@inventedArm load` receipt; the adapter is loaded where
      `connection_adapters.rb:42-44` loads it, or by the one step that already awaits before any
      `resolve` (the place is the story's decision, recorded in the PR body).
- [ ] `ConnectionAdapters.load`'s `@noRailsEquivalent PERMANENT` receipt is deleted with the function,
      or re-tagged to whatever story then owns it.
- [ ] If the async `import()` cannot leave `validateBang`, the story is blocked with that specific
      blocker (`pnpm tasks block`), not closed by a better justification.
- [ ] `database-configurations/` tests and `connection-adapters.test.ts` stay green; a plain-node
      import of a built standalone adapter entry still resolves.
