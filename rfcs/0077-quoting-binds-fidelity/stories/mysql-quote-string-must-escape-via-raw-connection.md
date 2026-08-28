---
title: "MySQL quote_string uses a static JS escaper instead of the driver's connection-aware escape (unsafe under NO_BACKSLASH_ESCAPES and multi-byte charsets)"
status: blocked
updated: 2026-08-27
rfc: "0077-quoting-binds-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: 8
pr: null
claim: "2026-08-27T23:28:19Z"
assignee: "single-to-sql-and-binds-compile-path"
blocked-by: "Rails' quote_string delegates to the driver's mysql_real_escape_string (abstract_mysql_adapter.rb:694-699), which is connection-aware. trails' driver is node mysql2, which is pure JS and has NO real_escape_string binding: Connection#escape (mysql2/lib/base/connection.js:562) delegates to sql-escaper's static CHARS_ESCAPE_MAP (sql-escaper@1.3.3/lib/index.js:15-25), which is no more connection-aware than trails' own mysql/quoting.ts#quoteString, ALSO adds surrounding quotes and ALSO escapes \\b and \\t (which mysql_real_escape_string does not) — so routing through it is a behavioural REGRESSION, not a convergence. The story's option 2 (cache charset + NO_BACKSLASH_ESCAPES at configureConnection and honour them in the sync escaper) remains available but the story body forbids closing on it without maintainer sign-off. Needs that sign-off, or a native escape binding."
closed-reason: null
---

## Context

Baselined in PR #6577 (RFC 0106 wave 3b): row
`quote_string | with_raw_connection` in
`scripts/api-compare/call-mismatches-exclude/activerecord/connection-adapters/abstract-mysql-adapter.json`.

`abstract_mysql_adapter.rb:694-699`:

    def quote_string(string)
      with_raw_connection(allow_retry: true, materialize_transactions: false) do |connection|
        connection.escape(string)
      end
    end

Rails delegates escaping to the DRIVER, which escapes per the CONNECTION's
current character set. trails (`abstract-mysql-adapter.ts:1145`) delegates to
`mysql/quoting.ts#quoteString`, a pure-JS backslash escaper.

This is not merely stylistic: `mysql_real_escape_string` changes behaviour
under `NO_BACKSLASH_ESCAPES` sql_mode (backslash stops being an escape
character, and `'` must be doubled instead), and multi-byte charsets such as
big5/gbk/sjis have sequences where a naive byte-wise backslash escape is
unsafe. A static escaper cannot see either condition.

**Why it was baselined:** `withRawConnection` is async; `quoteString(s: string):
string` is the synchronous `Quoting` contract that every `quote()` call site
depends on transitively.

## Converged shape

**Maintainer sign-off, 2026-08-28: take the charset/sql_mode caching approach.**
Rails' own shape — routing `quote_string` through the driver's
`escape` on the checked-out connection — is off the table, and not because it is
inconvenient. node `mysql2` is pure JS and has no `mysql_real_escape_string`
binding at all: `Connection#escape` (`mysql2/lib/base/connection.js:562`)
delegates to `sql-escaper`'s static `CHARS_ESCAPE_MAP`
(`sql-escaper@1.3.3/lib/index.js:15-25`), which is no more connection-aware than
trails' own `mysql/quoting.ts#quoteString`, ALSO adds surrounding quotes, and
ALSO escapes `\b` and `\t` where `mysql_real_escape_string` does not. Routing
through it would be a behavioural regression wearing Rails' call shape, and it
would additionally force the synchronous `Quoting` seam async across its whole
transitive caller set to buy that regression.

So the converged shape here is OUTPUT equivalence, reached synchronously:

- Cache the connection's character set and whether `NO_BACKSLASH_ESCAPES` is in
  `sql_mode` at `configure_connection` time, on the adapter.
- Have `quoteString` read that cached state and escape accordingly — doubling
  `'` and leaving backslash inert under `NO_BACKSLASH_ESCAPES`, and handling the
  multi-byte charsets (big5/gbk/sjis and friends) where a naive byte-wise
  backslash escape is unsafe.
- Keep the Rails name and the Rails call shape everywhere it can be kept; the
  divergence is confined to how the escaper learns the connection's state.

This is a genuine driver shortcoming, so it is justified at the call site as a
language/runtime shortcoming rather than converged away. The existing
`@missingRailsCall … PERMANENT` receipt on `with_raw_connection`
(`abstract-mysql-adapter.ts:1185`) is the right register for it, but its reason
must be rewritten to say THIS — that mysql2 exposes no connection-aware escape —
rather than the reason it carries now.

## Acceptance criteria

- [ ] The adapter caches the connection character set and the
      `NO_BACKSLASH_ESCAPES` `sql_mode` flag at `configure_connection` time.
- [ ] `quoteString` honours both, with the escaping OUTPUT proven equivalent to
      `mysql_real_escape_string` under `NO_BACKSLASH_ESCAPES` and under a
      multi-byte charset.
- [ ] The `@missingRailsCall` receipt at `abstract-mysql-adapter.ts:1185` keeps
      its `PERMANENT` token and carries the mysql2-has-no-escape-binding reason,
      citing `use-site:abstract_mysql_adapter.rb:694`.
- [ ] Regression tests that FAIL on baseline for both conditions.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.

## Triage note (2026-08-25): the baseline shard in this body is gone

`scripts/api-compare/call-mismatches-exclude/activerecord/connection-adapters/abstract-mysql-adapter.json`
**no longer exists**. The rows this story cites were retired from the baseline
into `@missingRailsCall … PERMANENT` receipts at the call sites in
`packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts`
(`with_raw_connection` at :1185). There is therefore no baseline row to retire
here — the work lands in that **JSDoc receipt**, whose `PERMANENT` token the
2026-08-28 sign-off above ratifies and whose reason this story rewrites.
Everything else here — the Rails and trails `file:line` citations and
the described divergence — is unaffected and was re-verified live on 2026-08-25.
