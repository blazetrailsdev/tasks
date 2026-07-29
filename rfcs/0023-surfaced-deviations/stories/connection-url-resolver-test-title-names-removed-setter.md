---
title: "connection-url-resolver test title still names the removed setProtocolAdapters"
status: draft
updated: 2026-07-29
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #5563 (RFC 0081), which deleted `setProtocolAdapters` in favour
of the `ActiveRecord.protocolAdapters` accessor.

`packages/activerecord/src/database-configurations/connection-url-resolver.test.ts:102`
is still titled:

`resolves through a mapping replaced via setProtocolAdapters`.

The function it names no longer exists. The title was deliberately left alone in PR
5563 because test names are never reworded in this repo (`test:compare` matches
our test names to Rails test names), so the stale name needs a decision rather
than a drive-by rename.

Rails' counterpart is the module writer itself —
`ActiveRecord.protocol_adapters=` (`vendor/rails/activerecord/lib/active_record.rb:490`);
there is no Rails test of that name, so this is a trails-only test with a
trails-only title.

## Acceptance criteria

- Confirm via `pnpm test:compare` that the test is unmatched (trails-only) and
  therefore that retitling costs no match.
- Retitle it to name the surviving API (or delete it if the Rails-matched
  coverage elsewhere already pins the behaviour), and record which of the two
  applied.
- No change to any test name that `test:compare` currently matches.
