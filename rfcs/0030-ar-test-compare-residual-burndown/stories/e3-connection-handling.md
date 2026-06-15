---
title: "E3 — standalone-connection + multi-db connection handling"
status: draft
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
cluster: "adapter"
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Part of RFC 0030-ar-test-compare-residual-burndown (test:compare residual burndown). StandaloneConnection parity + multi-db role connection handling + URL-config merge.

Counted `test:compare` skips covered by this story: **9** (snapshot 2026-06-15, `pnpm test:compare --cached --json --package activerecord`).

### Root causes (from `BLOCKED:`/`ROOT-CAUSE:` skip tags)

- connection-pool.ts or connection-handler.ts missing Rails parity for StandaloneConnectionTest
- connection-adapters/abstract/connection-handler.ts or abstract-adapter.ts#checkoutTimeout not raising correct error
- connection.ts or attribute-methods/connection.ts missing Rails parity

### Skipped tests to un-skip

- `connection_adapters/standalone_connection_test.rb` → `connection-adapters/standalone-connection.test.ts` — **4** counted skips:
  - can query
  - async fallback
  - can throw away
  - can close
- `connection_adapters/connection_handlers_multi_db_test.rb` → `connection-adapters/connection-handlers-multi-db.test.ts` — **1** counted skips:
  - multiple connections works in a threaded environment
  - loading relations with multi db connections
- `connection_adapters/merge_and_resolve_default_url_config_test.rb` → `connection-adapters/merge-and-resolve-default-url-config.test.ts` — **1** counted skips:
  - invalid symbol config
- `connection_handling_test.rb` → `connection-handling.test.ts` — **1** counted skips:
  - common APIs don't permanently hold a connection when permanent checkout is deprecated or disallowed
- `invalid_connection_test.rb` → `invalid-connection.test.ts` — **1** counted skips:
  - inspect on Model class does not raise
- `type_caster/connection_test.rb` → `type-caster/connection.test.ts` — **1** counted skips:
  - #type_for_attribute is not aware of custom types

## Acceptance criteria

- Every test listed above is un-skipped (`it.skip` → `it`) and passes against the canonical SQLite adapter (and PG/MySQL where the ruby gate applies).
- `pnpm test:compare --package activerecord` shows this story's files at **0 matchedSkipped** (or any residual reclassified to a permanent-skip with a recorded reason per the RFC's Deferred table).
- No new gate-mismatches introduced for these files.
- Refresh the RFC snapshot count after merge.
