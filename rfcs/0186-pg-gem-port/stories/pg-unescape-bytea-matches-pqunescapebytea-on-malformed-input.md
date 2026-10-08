---
title: "activerecord: unescape_bytea matches PQunescapeBytea on malformed input"
status: draft
updated: 2026-10-07
rfc: "0186-pg-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/connection-adapters/postgresql/pg-connection.ts` `unescapeBytea` is
libpq's `PQunescapeBytea` (`PG::Connection.unescape_bytea`, called at
`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql/oid/bytea.rb:11`).
Two arms differ from libpq's `fe-exec.c`:

- A backslash followed by something that is neither a backslash nor three octal digits: libpq
  swallows the backslash and emits the following byte; the port emits the backslash too.
- The hex form: libpq skips invalid hex digits pairwise; the port hands the tail to
  `Buffer.from(_, "hex")`, which stops at the first invalid pair.

Server output never contains either, so only a caller passing hand-written text can see it.

## Acceptance criteria

- [ ] Both arms match `PQunescapeBytea`, each with a test against the value MRI's pg gem returns.
