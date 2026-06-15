---
title: "connection-swapping-nested: use file-backed per-database DBs like Rails"
status: draft
updated: 2026-06-15
rfc: "0029-sqlite-memory-fidelity"
cluster: test-connection-fidelity
deps: []
deps-rfc: []
est-loc: 90
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

trails' `connection-adapters/connection-swapping-nested.test.ts` hardcodes
`database: ":memory:"` for all four databases (primary / primary_replica /
secondary / secondary_replica) — 36 occurrences, the single largest `:memory:`
divergence in the suite.

Rails' counterpart builds the same four databases as **on-disk files**:

```ruby
# vendor/rails/activerecord/test/cases/connection_adapters/connection_swapping_nested_test.rb:51-54
"primary"          => { "adapter" => "sqlite3", "database" => "test/db/primary.sqlite3" },
"primary_replica"  => { "adapter" => "sqlite3", "database" => "test/db/primary.sqlite3", "replica" => true },
"secondary"        => { "adapter" => "sqlite3", "database" => "test/db/secondary.sqlite3" },
"secondary_replica"=> { "adapter" => "sqlite3", "database" => "test/db/secondary_replica.sqlite3", "replica" => true },
```

Files matter here: the test verifies that swapping between nested
connections addresses genuinely distinct databases and that replicas share a
file with their primary. With `:memory:`, each connection gets its own private
in-memory DB (no sharing), so the replica/primary relationship Rails encodes is
not exercised — the test is structurally weaker than Rails'.

## Acceptance criteria

- [ ] Each of the four database configs uses a **file-backed** SQLite path,
      mirroring Rails' primary/replica file-sharing structure (replica points
      at the same file as its primary; secondary distinct). Use temp paths via
      the fs/os-adapter, not literal `test/db/*.sqlite3` (trails has no
      `test/db` fixtures dir) — the fidelity property is _file-backed + correct
      sharing topology_, not the literal path.
- [ ] DB files are created in a `beforeAll`/`beforeEach` and cleaned up
      (`-wal`/`-shm` sidecars too — see `sqlite-template.ts unlinkDbFiles`) so
      no temp files leak and no cross-test collision occurs.
- [ ] Test names unchanged; assertions mirror the Rails test's swap/replica
      expectations (read `connection_swapping_nested_test.rb` first).
- [ ] CI green on all three adapters; `test:compare` delta non-negative.

## Notes

Read the full Rails test before editing — confirm which of the four are meant
to share a file. This file is self-contained; no overlap with sibling stories.
</content>
