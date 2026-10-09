---
title: "activerecord: Mysql2Adapter initialize, discard! and configure_connection take Rails' control flow"
status: in-progress
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: trails#8714
claim: "2026-10-09T15:39:41Z"
assignee: "activerecord-converge-invented-control-flow-arms-root-q-z-part-2-residue"
blocked-by: null
closed-reason: null
---

## Context

Remainder of `activerecord-converge-invented-control-flow-arms-connection-adapters-root-part-1`
(trails#8490), which converged or receipted every other row it listed. Supersedes
`activerecord-converge-invented-control-flow-arms-connection-adapters-root-part-1-residue`, whose
list went stale during that PR's review. `pnpm parity:api:arms:report --package=activerecord --direction=invented`
(after `pnpm build && API_COMPARE_FORCE=1 pnpm parity:api --calls`):

- `connection-adapters/mysql2-adapter.ts#constructor` — `+throw +if ×13 +try ×2 +rescue ×2`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/mysql2_adapter.rb:55-68`).
  Rails is `super`, `@affected_rows_before_warnings = nil`, `@config[:flags] ||= 0`, one
  `if`/`else` on `@config[:flags].kind_of? Array`, and `@connection_parameters ||= @config`. The
  port also parses a URL string config (`wait_timeout`, database from the path), accepts the
  deprecated raw-connection argument, and builds the npm `mysql2` pool options (`_poolConfig`,
  `username` -> `user`, `socket` -> `socketPath`) in line. That translation belongs at the driver
  boundary, `Mysql2Adapter.new_client` (`mysql2_adapter.rb:23-36`), which
  `activerecord-converge-invented-control-flow-arms-connection-adapters-root-part-2` lists as
  `newClient`.
- `connection-adapters/mysql2-adapter.ts#discardBang` — `+if` (`mysql2_adapter.rb:131-137`). Rails is
  `@lock.synchronize { super; @raw_connection&.automatic_close = false; @raw_connection = nil }`.
  The extra arm is the connect-generation bookkeeping for an in-flight `_connectingPromise`.
- `connection-adapters/mysql2-adapter.ts#configureConnection` — `+if` (`mysql2_adapter.rb:158-162`).
  Rails sets two `query_options` and calls `super`. The extra arm is the
  `_connectionConfigured || !_rawConnection` early return.

Two rows from the same PR carry `@inventedArm` receipts naming other stories and are not this
story's: `abstract-adapter.ts#typeMap` (`adapter-extended-type-maps-onto-concurrent-map`) and
`abstract-mysql-adapter.ts#dropTable`
(`activerecord-converge-invented-control-flow-arms-abstract-quoting-and-table-ddl`, which should
converge the MySQL override with the base method and delete the receipt).

## Acceptance criteria

- [ ] `Mysql2Adapter#initialize` is Rails' body; URL parsing and npm option translation live at the `new_client` boundary.
- [ ] `discard!` and `configure_connection` match Rails' control flow, or each surviving arm is shown to be forced by the async driver and receipted `@inventedArm … — PERMANENT`.
- [ ] The invented-direction report shows 0 activerecord rows for `connection-adapters/mysql2-adapter.ts#constructor`, `#discardBang` and `#configureConnection`.
