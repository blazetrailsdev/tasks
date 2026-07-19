---
title: "Guard PG conn-param allowlist against pg driver drift"
status: ready
updated: 2026-07-19
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #4970 ported Rails' `conn_params` allowlist
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:330-331`,
`conn_params.slice!(*valid_conn_param_keys)`) into
`PostgreSQLAdapter.VALID_CONN_PARAM_KEYS`
(`packages/activerecord/src/connection-adapters/postgresql-adapter.ts`).

Rails derives its key list at RUNTIME from the driver
(`PG::Connection.conndefaults_hash.keys`), so it can never drift. Ours is a
hand-maintained literal transcribed from the pinned pg@8.20 source:

- `pg/lib/connection-parameters.js:63-127` — user, database, password, port,
  host, binary, options, ssl, client_encoding, replication, application_name,
  fallback_application_name, statement_timeout, lock_timeout,
  idle_in_transaction_session_timeout, query_timeout, connectionTimeoutMillis,
  keepAlive, keepAliveInitialDelayMillis, connectionString.
- `pg/lib/client.js:62-99` — Promise, types, enableChannelBinding, connection,
  stream, binary.

Two drift risks, both silent:

1. **pg adds a keyword** — it lands outside the allowlist and is dropped before
   reaching the driver. Fails as "option had no effect", not as an error.
2. **pg removes one** — `Promise` and `connection` are already deprecated with
   removal announced for pg@9 (`client.js:23-37` deprecation notices). The
   allowlist keeps accepting them after they stop working.

Review of #4970 caught exactly this class of error once already: the first
version sliced against `@types/pg`'s `ClientConfig`, which is narrower than the
driver and omits `binary`, `replication`, `enableChannelBinding`, `connection`
and `Promise` — so five valid driver params were being silently stripped.
Nothing in CI would have caught it.

## Acceptance criteria

- A test or lint derives the accepted-keyword set from the INSTALLED `pg`
  package rather than a transcription, and fails when
  `VALID_CONN_PARAM_KEYS` drifts from it in either direction.
- Deriving from `pg` internals is acceptable (the adapter already depends on
  pinned internals — see `_rawConnectionFinished`), but the guard must name the
  exact source files/lines it reads so a pg upgrade points at what to re-check.
- If a fully automatic derivation proves too brittle against pg's private
  layout, an explicit pinned-version assertion (fail on `pg` version bump until
  the list is re-verified) is an acceptable fallback — record which was chosen
  and why.
- Cover the deprecated-key case: document what should happen to `Promise` /
  `connection` when pg@9 removes them.
