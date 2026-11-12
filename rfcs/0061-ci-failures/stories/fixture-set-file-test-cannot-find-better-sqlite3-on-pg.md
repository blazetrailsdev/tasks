---
title: "fixture-set/file.trails.test.ts intermittently cannot resolve better-sqlite3 on the PG lane"
status: draft
updated: 2026-11-12
rfc: "0061-ci-failures"
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

Main CI run 43213144715 (commit 20fdbe9f43), job "Active Record PostgreSQL Tests (1)": `packages/activerecord/src/fixture-set/file.trails.test.ts` failed to load with `Cannot find module '/home/runner/work/trails/trails/node_modules/.pnpm/better-sqlite3@13.0.3/node_modules/better-sqlite3/lib/index.js'`. In the same shard, 336 other files loaded that module without error. The log gives no stack trace.

Already ruled out (trails#10026 investigation):

- The file passes when run alone with the PG environment.
- No test in the shard's packages (activerecord, solid-queue, solid-cable, activestorage, actiontext) mocks Node module resolution or `fs`, runs pnpm, or deletes or chmods anything under `node_modules`.
- `sqlite3-trails-root.trails.test.ts`'s `process.chdir` is skipped on PG.

## Acceptance criteria

- Find what makes Node's resolver miss `better-sqlite3/lib/index.js` for this one file. Candidates: the fork's import order, fd exhaustion under load (setup took 622s), or a sibling test that changes the filesystem.
- Fix that cause so the file loads in every PG shard, with no retry and no skip.
