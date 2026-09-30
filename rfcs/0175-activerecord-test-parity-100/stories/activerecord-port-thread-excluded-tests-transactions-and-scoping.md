---
title: "activerecord: port the 10 Thread-excluded transaction, scoping, locking and selector tests"
status: ready
updated: 2026-09-30
rfc: "0175-activerecord-test-parity-100"
cluster: unported-tests
packages: ["activerecord"]
deps: ["drop-stale-deadlock-unported-file-exclusions"]
deps-rfc: []
est-loc: 550
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Second half of the Thread/GVL exclusions (see `activerecord-port-thread-excluded-tests-pool-and-cache` for
the shape):

- `scoping/default_scoping_test.rb` — "default scoping with threads"; "default scope is threadsafe"
  reason: Real OS threads (Thread.new / Concurrent::CyclicBarrier); no single-threaded Node.js equivalent.
- `locking_test.rb` — "no locks no wait"
  reason: Thread-based `duel` racing two `joinable: false` transactions on one row and asserting wall-clock ordering; no single-threaded JS equivalent.
- `transactions_test.rb` — "transaction per thread"; "transaction isolation read committed"; "rollback when thread killed"; "connection removed from pool when thread killed in begin after successfully beginning a transaction"
  reason: Thread.new + Thread#kill to assert per-thread transaction isolation and connection-pool cleanup on thread death. Ruby Thread.kill and the shared-memory Thread model have no Node.js equivalent.
- `database_selector_test.rb` — "preventing writes works in a threaded environment"
  reason: Spawns concurrent Ruby Threads to assert write-prevention state is thread-isolated (database_selector_test.rb:226-244). GVL / shared-memory Thread semantics have no Node.js equivalent.
- `encryption/concurrency_test.rb` — (whole file)
  reason: Encrypts/decrypts records across concurrent Ruby Threads to assert the encryption context is thread-local. The entire file is a Thread.new concurrency test with no single-threaded JS equivalent.
- `adapters/abstract_mysql_adapter/transaction_test.rb` — "raises Deadlocked when a deadlock is encountered"
  reason: Provokes a MySQL deadlock across two Ruby Threads (transaction_test.rb:38-60). A deadlock requires genuine concurrency; single-threaded JS cannot reproduce it.

`drop-stale-deadlock-unported-file-exclusions` (RFC 0127) already retires the deadlock entries whose PG
siblings are ported.

## Acceptance criteria

- [ ] Same as the pool-and-cache half: Rails' bodies over `withExecutionContext`, unported entries deleted, and any genuinely-unschedulable case split out with its specific blocker.
