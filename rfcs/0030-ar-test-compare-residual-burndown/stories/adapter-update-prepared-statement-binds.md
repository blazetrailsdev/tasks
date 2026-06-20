---
title: "Write-path binds round-trip prepared statement (null-byte values)"
status: ready
updated: 2026-06-20
rfc: "0030-ar-test-compare-residual-burndown"
cluster: adapter
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`packages/activerecord/src/adapter.test.ts` "update prepared statement" is gated
`adapterType === "postgres"` (Rails runs it on MySQL + SQLite, excluding only PG;
`adapter_test.rb:19`) but `ctx.skip()`-pending. trails inlines string literals
into INSERT SQL instead of binding them as prepared-statement parameters, so an
embedded null byte (`\x00`) truncates the SQL at the C-string boundary. The write
path must round-trip binds through a prepared statement (matching Rails'
`type_casted_binds`) for the null-byte name to survive. No open tracking story.

## Acceptance criteria

- [ ] INSERT/UPDATE write path binds string literals as prepared-statement
      parameters (no inlining), so a `\x00`-containing value round-trips.
- [ ] Drop `ctx.skip()`; test runs on MySQL and SQLite.
- [ ] `test:compare` delta non-negative; test name unchanged.
