---
title: "E3 — standalone-connection + multi-db connection handling"
status: ready
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
cluster: "adapter"
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Part of RFC 0030-ar-test-compare-residual-burndown (test:compare residual burndown). StandaloneConnection parity + multi-db role connection handling + URL-config merge.

**6** `it.skip` tests to un-skip across 6 file(s) (deduped; permanent-skips — Marshal/YAML/thread/fork/Rational — excluded). For reference, `test:compare` reports **9** `matchedSkipped` for these files (snapshot 2026-06-15); any delta is permanent/​gated skips not on the un-skip list.

### Root causes (from `BLOCKED:`/`ROOT-CAUSE:` skip tags)

- connection-adapters/abstract/connection-handler.ts or abstract-adapter.ts#checkoutTimeout not raising correct error
- connection.ts or attribute-methods/connection.ts missing Rails parity

### Skipped tests to un-skip

- `connection_adapters/standalone_connection_test.rb` → `connection-adapters/standalone-connection.test.ts` — **0** un-skip targets (file's 4 counted skip(s) are gated via `describeIf*`/`skipIf`, not `it.skip`; verify during the story).
- `connection_adapters/connection_handlers_multi_db_test.rb` → `connection-adapters/connection-handlers-multi-db.test.ts` — **2** to un-skip:
  - multiple connections works in a threaded environment
  - loading relations with multi db connections
- `connection_adapters/merge_and_resolve_default_url_config_test.rb` → `connection-adapters/merge-and-resolve-default-url-config.test.ts` — **1** to un-skip:
  - invalid symbol config
- `connection_handling_test.rb` → `connection-handling.test.ts` — **1** to un-skip:
  - common APIs don't permanently hold a connection when permanent checkout is deprecated or disallowed
- `invalid_connection_test.rb` → `invalid-connection.test.ts` — **1** to un-skip:
  - inspect on Model class does not raise
- `type_caster/connection_test.rb` → `type-caster/connection.test.ts` — **1** to un-skip:
  - #type_for_attribute is not aware of custom types

## Acceptance criteria

- [ ] Every test listed above is un-skipped (`it.skip` → `it`) and passes against the canonical SQLite adapter (and PG/MySQL where the ruby gate applies).
- [ ] `pnpm test:compare --package activerecord` shows these files with no `it.skip`-based `matchedSkipped` (any residual reclassified to a permanent-skip with a recorded reason per the RFC Deferred table).
- [ ] No new gate-mismatches introduced for these files.
- [ ] Refresh the RFC snapshot count after merge.
