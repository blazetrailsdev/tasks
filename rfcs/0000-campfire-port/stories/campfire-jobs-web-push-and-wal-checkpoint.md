---
title: "Campfire example: jobs on Solid Queue, the web push pool and the SQLite WAL checkpoint"
status: draft
updated: 2026-11-27
rfc: "0000-campfire-port"
cluster: campfire-app
packages: [examples, activejob, solid-queue, ruby-compat]
deps: [campfire-models-users-messages-push, web-push-port, surfguard-port]
deps-rfc: []
est-loc: 1100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design and Open question 2. `app/jobs/` (6 files, 35 lines);
`lib/web_push/` (`pool.rb` 60 lines on a thread pool, `connections.rb` 125
lines of pinned TLS connections, `notification.rb`);
`config/initializers/web_push.rb` (prepends `PersistentRequest` onto
`WebPush::Request`, `at_exit` shutdown) and `vapid.rb`;
`lib/rails_ext/sqlite_wal_checkpoint.rb` (187 lines) and its initializer, which
fork; tests `test/lib/web_push/` (353) and `sqlite_wal_checkpoint_test.rb` (313).

## Acceptance criteria

- [ ] every job ported and run on Solid Queue
- [ ] `WebPush::Pool` on ruby-compat's `Thread`, `Connections` over ruby-compat `Net::HTTP`, `PersistentRequest` installed with `prepend()`
- [ ] the WAL checkpoint ported per the RFC's answer to Open question 2, a fork-only test parked under `PERMANENT-SKIP:` citing CLAUDE.md, "Runtime facts Node does not expose"
- [ ] every listed test file ported and passing

## Notes

Framework gaps the port finds are filed in the owning package's surfaced-deviations bucket and fixed there, not worked around in the app (RFC § Verification).
