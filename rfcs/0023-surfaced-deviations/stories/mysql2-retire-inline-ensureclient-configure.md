---
title: "mysql2: retire inline _ensureClient configure in favor of single attempt_configure_connection dispatch"
status: draft
updated: 2026-07-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

After PR #5137, `Mysql2Adapter#reconnect()` opens the socket without
configuring (`_ensureClient(false)`, mirroring mysql2_adapter.rb:144/:150) and
the reconnectBang lifecycle dispatches the overridable hook exactly once via
`attemptConfigureConnection`. But direct `_ensureClient()` callers — the lazy
per-query connect seam (mysql2-adapter.ts:~176 via `activeAsync`, and the
openAsync/database-tasks probe at ~421) — still run an INLINE
`configureConnection()` inside the connect promise chain
(mysql2-adapter.ts:~817), with a local disconnectBang-on-failure that
duplicates `attemptConfigureConnection`'s teardown (abstract-adapter.ts:2492,
abstract_adapter.rb:1216). Rails has no configure-inside-raw-connect anywhere:
every configure dispatch flows through connect!/reconnect!/verify!.

If those direct callers can be shown to always run under (or be routed
through) the verifyBang/reconnectBang lifecycle now that `connectBang` routes
through `verifyBang`, the inline configure + its bespoke error teardown and
the `configure` parameter can be deleted, leaving one dispatch site as in
Rails.

## Acceptance criteria

- [ ] Inventory direct `_ensureClient()` callers and determine which can reach
      an unconfigured socket without the lifecycle running configure.
- [ ] Either delete the inline configure + `configure` param (single dispatch
      via attemptConfigureConnection, as Rails) or justify the remaining inline
      call at the call site with the concrete caller that needs it.
- [ ] mysql2-adapter.configure-on-connect.trails.test.ts and adapter_test.rb
      recovery/retry tests stay green on MySQL/MariaDB lanes.
