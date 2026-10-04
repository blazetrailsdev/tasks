---
title: "activerecord: remove the invented branches left in the root connection adapters (part 1 residue)"
status: closed
updated: 2026-10-04
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "superseded by mysql2-adapter-initialize-discard-and-configure-take-rails-control-flow; the other rows were converged or receipted in trails#8490"
---

## Context

Remainder of `activerecord-converge-invented-control-flow-arms-connection-adapters-root-part-1`,
which converged the rest of its rows and left these. `pnpm parity:api:arms:report --package=activerecord --direction=invented`:

- `connection-adapters/abstract-adapter.ts#columnFor` — `+if`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:1165-1169`).
  Rails is `columns(table_name).detect { … } || raise(ActiveRecordError, …)`, which the Ruby
  skeleton reads `or throw`; JS has no throw expression, so the port is `if (!col) throw`. This is
  an extractor false-positive class (`x || raise` against `if (!x) throw`), to fix in
  `scripts/api-compare/` with a unit test. The body also drops Rails' `column_name = column_name.to_s`.
- `connection-adapters/abstract-adapter.ts#translateExceptionClass` — `+if` (`abstract_adapter.rb:1122-1132`).
  The extra arm sets `cause` on the translated error. Ruby sets `cause` implicitly at the `raise`
  inside the `rescue` (the three raise sites in `reconnect!` / `with_raw_connection`), not in this
  method. It wants a ruby-compat raise-in-rescue seam at the raise sites;
  `adapter.test.ts`, `sqlite/errors.trails.test.ts` and the mysql2 trails tests read `.cause`.
- `connection-adapters/abstract-adapter.ts#typeMap` — `+if` (`abstract_adapter.rb:1112-1120`).
  Owned by `adapter-extended-type-maps-onto-concurrent-map` (`compute_if_absent`).
- `connection-adapters/abstract-mysql-adapter.ts#dropTable` — `+loop +if +if`
  (`connection_adapters/abstract_mysql_adapter.rb:354-357`). Same trailing-`undefined` / block
  stripping loop and hand-rolled options split as the base `dropTable`, which
  `activerecord-converge-invented-control-flow-arms-abstract-quoting-and-table-ddl` owns; converge
  the two together.
- `connection-adapters/abstract-mysql-adapter.ts#checkConstraints` — `+loop` (`abstract_mysql_adapter.rb:510-542`).
  Rails is `chk_info.map do |row|`; the port is a `for` loop pushing onto an array because the
  body awaits `isMariadb()` per row.
- `connection-adapters/abstract-mysql-adapter.ts#handleWarnings` — `+if` (`abstract_mysql_adapter.rb:770-784`).
  Rails has one guard, `return if ActiveRecord.db_warnings_action.nil? || @raw_connection.warning_count == 0`.
  The port splits it in two around the invented `warningCount(rawConnection)` helper, which falls
  back to a `SHOW COUNT(*) WARNINGS` query when the driver handle has no `warningCount`.
- `connection-adapters/abstract-mysql-adapter.ts#removeForeignKey` — `+if`
  (`connection_adapters/mysql/schema_statements.rb:88-93`). The body is now Rails' two `if`s plus
  the leading kwargs-rebinding guard; `arms-extractor-reads-a-kwargs-rebinding-guard` clears it.
- `connection-adapters/abstract-mysql-adapter.ts#quoteString` — `+if`, receipted
  `@inventedArm if — CONVERGEABLE mysql-quote-string-escapes-without-with-raw-connection`.
- `connection-adapters/mysql2-adapter.ts#constructor` — `+throw +if ×13 +try ×2 +rescue ×2`
  (`connection_adapters/mysql2_adapter.rb:55-68`). Rails is `super`, `@config[:flags] ||= 0`, one
  `if`/`else` on `flags.kind_of? Array`, and `@connection_parameters ||= @config`. The port also
  parses a URL string config, accepts the deprecated raw-connection argument, and builds the npm
  `mysql2` pool options (`_poolConfig`) in line.
- `connection-adapters/mysql2-adapter.ts#discardBang` — `+if` (`mysql2_adapter.rb:131-137`). The
  connect-generation bookkeeping for an in-flight `_connectingPromise`; Rails' body is
  `@lock.synchronize { super; @raw_connection&.automatic_close = false; @raw_connection = nil }`.
- `connection-adapters/mysql2-adapter.ts#configureConnection` — `+if` (`mysql2_adapter.rb:158-162`).
  The `_connectionConfigured` early return.

## Acceptance criteria

- [ ] Every real invented guard above is removed so the body matches Rails' control flow.
- [ ] The `x || raise` false positive is fixed in `scripts/api-compare/` with a unit test, and its effect on the other packages is recorded in the PR body.
- [ ] The invented-direction report shows 0 activerecord rows for these methods, or each remaining one carries an `@inventedArm` receipt naming the story that owns it.
