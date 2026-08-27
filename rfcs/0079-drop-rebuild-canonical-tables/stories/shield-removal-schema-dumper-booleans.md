---
title: "Remove the schema-dumper booleans shield"
status: ready
updated: 2026-08-27
rfc: "0079-drop-rebuild-canonical-tables"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/schema-dumper.test.ts:994` (re-verified on
`origin/main` 2026-08-09) rebuilds `booleans` (+
companions). schema-dumper.test was the largest dropper in RFC 0070's exclude
backlog (7 drops) and has a PG dump-timeout flake history; verify from the
Phase-1 inventory whether the shield guards against its own earlier drops or a
sibling, fix the source, and delete the shield.

## Phase-1 attribution (2026-08-26)

`schema-dumper.test.ts` is `:1005`, not `:994`. **Group A — the shield guards
its own drops, not a sibling.** The deferred `SchemaDumperTest` cases
`force`-create `string_key_objects` (`:451`), `products` (`:461`), `booleans`
(`:558`), `numeric_data` (`:651`) and `posts` (`:795`/`:879`/`:909`) on the
shared per-worker DB; the `afterAll` at `:982-1001` drops all 20 tables, and the
rebuild at `:1005` puts the 7 canonical ones back.

Fix at the source: those cases assert on dump _text_, not on canonical shape, so
move them onto bespoke table names. Both the canonical half of the drop list and
the rebuild then go. Note this file is also the drift source cited (wrongly, as
of today) by the `enum.trails.test.ts` and `unsafe-raw-sql.test.ts` shields.

## Acceptance criteria

- The listed `rebuildCanonicalTables` call site(s) are deleted, and the suites stay green when co-scheduled with the full AR suite on sqlite + PG + MySQL/MariaDB (the shield must be unnecessary, not just removed).
- The contaminating sibling is fixed at the source: it restores the canonical shape itself, runs against `fixtures({ ... })` / transactional rollback, or its reshaping moves off the shared canonical tables. Name the culprit and fix in the PR body.
- No test renames; parity:test delta non-negative.
