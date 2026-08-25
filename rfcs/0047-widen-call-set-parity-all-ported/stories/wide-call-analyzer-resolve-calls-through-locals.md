---
title: "Wide call analyzer: resolve calls through local bindings / helper delegation (kill false positives)"
status: done
updated: 2026-06-30
rfc: "0047-widen-call-set-parity-all-ported"
cluster: null
deps: []
deps-rfc: []
est-loc: 160
priority: 1
pr: 4302
claim: "2026-06-30T01:34:32Z"
assignee: "wide-call-analyzer-resolve-calls-through-locals"
blocked-by: null
---

## Context

Surfaced during PR #4284 (pg-serialize-fire-and-forget-client-query-sites). The
wide call-mismatch analyzer (`scripts/api-compare/compare.ts --wide-calls`,
gated by `scripts/api-compare/lint-call-mismatches-wide.ts`, RFC 0047) only
resolves a ported method's calls from a **single directly-returned `new`/call
expression**. It produces FALSE "omitted call" flags when the identical calls
are present but the body is shaped differently.

Concrete repro from #4284, `PostgreSQLAdapter#buildStatementPool` vs Rails
`build_statement_pool` (`vendor/rails/.../postgresql_adapter.rb:1055` =
`StatementPool.new(self, type_cast_config_to_integer(@config[:statement_limit]))`):

- `return new StatementPool(client, this._statementLimit)` → analyzer resolves
  `new` AND `type_cast_config_to_integer` (via the 2nd ctor arg). PASSES.
- `const pool = new StatementPool(client, this._statementLimit); ...; return pool`
  → analyzer reports BOTH `new` and `type_cast_config_to_integer` as omitted.
  FALSE POSITIVE — the `new` call is plainly present.
- `return this._makeStatementPool(client)` (one-line helper delegating to the
  same `new`) → same false positives.

Effect: forced a contorted workaround in #4284 — a file-scope
`WeakMap<pg.Client, serializer>` populated by the `_rawConnection` setter — purely
to keep `buildStatementPool`'s body as the exact single-return expression the
analyzer accepts, rather than the more natural `const pool = ...; pool.x = ...;
return pool`. The gate is dictating code shape, not parity.

## Acceptance criteria

- [ ] Wide call analyzer resolves calls through local `const`/`let` bindings
      (`const x = new Foo(...); return x`) so a returned local is equivalent to a
      directly-returned expression.
- [ ] Resolves calls through trivial single-statement private-helper delegation
      (one level) OR documents why that is out of scope.
- [ ] Regression fixture: `buildStatementPool`-style multi-statement body that
      still makes the `new` + arg-derived calls is NOT flagged.
- [ ] Existing baseline (`call-mismatches-wide-exclude.json`) only shrinks; no
      new false negatives introduced (the genuine omissions it catches still flag).
