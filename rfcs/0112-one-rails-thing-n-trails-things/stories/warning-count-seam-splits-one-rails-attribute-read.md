---
title: "handle_warnings' @raw_connection.warning_count read became a trails-only warningCount method"
status: blocked
updated: 2026-08-20
rfc: "0112-one-rails-thing-n-trails-things"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 110
priority: null
pr: null
claim: "2026-08-20T18:15:06Z"
assignee: "converge-assign-attribute-writer-ladder-onto-public-send"
blocked-by: "mysql2 npm 3.19.0 exposes no warning_count on the connection: lib/connection.js has no 'warning' at all, and the protocol count is parsed only into ResultSetHeader.warningStatus (lib/packets/resultset_header.js:34), which no command in lib/commands/ hands to the caller — a SELECT resolves as [rows, fields] and the header is discarded. So handleWarnings cannot read the count off the raw connection the way abstract_mysql_adapter.rb:771/773 does without patching the driver or wrapping every command to capture the header. Blocked on mysql2 surfacing warningStatus on the connection or per result; until then the SHOW COUNT(*) WARNINGS fallback is the only read, and being a round-trip it forces the async, read-once shape."
closed-reason: null
---

## Context

Rails' `AbstractMysqlAdapter#handle_warnings` reads the warning count straight
off the raw connection, twice, with no method of its own
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb:770-773`):

    def handle_warnings(sql)
      return if ActiveRecord.db_warnings_action.nil? || @raw_connection.warning_count == 0

      warning_count = @raw_connection.warning_count
      result = @raw_connection.query("SHOW WARNINGS")

The Ruby mysql2 gem exposes `warning_count` as an attribute on the connection,
so Rails needs no seam.

PR #6772 moved `handle_warnings` onto `AbstractMysqlAdapter` where Rails puts
it, and in doing so introduced `warningCount`
(`packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts`,
just below `handleWarnings`) — a protected method with no Rails counterpart:

    protected async warningCount(rawConnection: { warningCount?: unknown; query(...) }): Promise<number> {
      if (typeof rawConnection.warningCount === "number") return rawConnection.warningCount;
      const [rows] = await rawConnection.query("SHOW COUNT(*) WARNINGS");
      ...
    }

It exists because the mysql2 **npm** driver only populates `warningCount` when
the last protocol packet carried it, so the attribute read alone is unreliable
and needs a `SHOW COUNT(*) WARNINGS` fallback. Being `protected` it is not
counted by `parity:api:extra`, so nothing measures it — this story is the only
record.

Two consequences worth noting for whoever picks this up:

- Rails reads the attribute twice; trails reads once into a local, because the
  fallback arm is a round-trip and reading twice would double it.
- The fallback makes the read `async`, which is why `handleWarnings` awaits
  something Rails does not.

## Converged shape

No `warningCount` method: `handleWarnings` reads the count off the raw
connection inline, exactly as `rb:771` and `rb:773` do. That requires the raw
connection trails hands the adapter to reliably carry `warningCount` — i.e.
the fallback moves down into whatever wraps the mysql2 npm client, so the
adapter sees the same attribute Rails' mysql2 gem exposes, or the driver is
configured/queried such that the field is always populated after a statement.

Investigate first whether mysql2's `serverStatus`/`warningCount` can be relied
on for every statement shape (the fallback was written defensively, and it may
be that only some paths leave it unset). If it can, the fallback and the method
both go and the read becomes synchronous, matching Rails. If it genuinely
cannot, this is a driver-level shortcoming and the story should be `blocked`
with that finding — not closed by re-justifying the seam.

## Acceptance criteria

- [ ] `handleWarnings` reads the warning count the way `rb:771`/`rb:773` do,
      with no trails-only method between it and the raw connection — or the
      story is `blocked` with the specific mysql2 driver limitation that
      prevents it.
- [ ] The `SHOW COUNT(*) WARNINGS` fallback, if still needed, lives below the
      adapter rather than inside a ported Rails method.
- [ ] `warnings.test.ts` still covers the `db_warnings_action` `:raise` / `:log`
      / proc arms and the "warning_count does not match returned warnings"
      branch (it currently reaches that branch by stubbing `warningCount`, so it
      needs a new seam or a driver-level stub).
- [ ] MySQL and MariaDB lanes green.
