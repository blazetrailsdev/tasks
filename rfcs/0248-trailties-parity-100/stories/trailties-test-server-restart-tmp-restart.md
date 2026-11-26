---
title: "trailties-test-server-restart-tmp-restart"
status: draft
updated: 2026-11-26
rfc: "0248-trailties-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split from `trailties-test-minitest-reporters-and-server-restart` (whose four
reporter tests are parked `PERMANENT-SKIP:` in
`packages/trailties/test/minitest/trails-plugin.test.ts`).

`vendor/rails/v8.0.5.2/railties/test/application/server_test.rb:19-40` "restart rails server
with custom pid file path": `trails restart` touches `tmp/restart.txt`
(`packages/trailties/lib/commands/restart.ts`) but nothing in rackup's node handler watches it
and prints "Restarting" (Puma's `tmp_restart` plugin in Rails).

## Acceptance criteria

- [ ] "restart trails server with custom pid file path" ported into `test/application/server.test.ts` and passing.
