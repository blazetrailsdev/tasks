---
title: "small-packages-reach-100-remainder"
status: claimed
updated: 2026-11-26
rfc: "0259-near-complete-packages-to-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-26T14:14:48Z"
assignee: "generator-class-paths-actiontext-actionmailbox-stimulus"
blocked-by: null
closed-reason: null
---

## Context

Split from `small-packages-reach-100`, which ported actioncable
"unsubscribed? method returns correct status", both Mailgun timestamp tests,
activejob "retry different queue logging", mini-magick "accepts options" and
rails-dom-testing "assert select root xml" (rack-session's skip already
carried its `PERMANENT-SKIP:` line). Two tests remain:

- `vendor/rails/v8.0.5.2/actioncable/test/channel/stream_test.rb:284`
  "concurrent unsubscribe_from_channel and stream_from do not raise
  RuntimeError": two Ruby threads synchronised by a
  `Concurrent::CyclicBarrier`, with `pubsub.unsubscribe_latency = 0.1`.
  Needs a ruby-compat `Thread` port of the barrier dance against
  `packages/actioncable/lib/channel/streams.ts`, or an operator ruling.
- `vendor/sqlite3/v2.7.3/test/test_database.rb:540` "interrupt closed":
  `@db.close; assert_raise(SQLite3::Exception) { @db.interrupt }`.
  `SQLite3::Database#interrupt` (the C `interrupt`, which raises on a closed
  db via `REQUIRE_OPEN_DB`) is not ported in
  `packages/sqlite3/lib/database.ts`; better-sqlite3 / node:sqlite expose no
  `sqlite3_interrupt`.

## Acceptance criteria

- Both tests are ported and pass, or parked as `it.skip` with a cited
  `PERMANENT-SKIP:` line after an operator ruling.
- `pnpm parity:test` reports 100.0 for actioncable and sqlite3.
