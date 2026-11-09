---
title: "ruby-compat fs adapter: add async appendFile"
status: draft
updated: 2026-11-09
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`@blazetrails/ruby-compat`'s fs adapter (`packages/ruby-compat/src/fs-adapter.ts`, d.ts line 57) has only
`appendFileSync(path, content)`. It has `readFile` async, but no async append. trailmap#135's
`logGhFailure` (`lib/stats-sync/sync.ts`) and every `[cron-wrapper]` line in `app/jobs/stats-sync-job.ts`
must block the event loop to append to a log, against the "async fs only" rule for apps. Expected shape:
`appendFile(path: string, content: string): Promise<void>` beside `appendFileSync`, backed by
`node:fs/promises` `appendFile` in the node adapter.

## Acceptance criteria

- The fs adapter exposes async `appendFile`, implemented in each platform adapter, with a test.
- trailmap's stats-sync appends move to it after the next vendor bump.
