---
title: "bin/jobs forwards its arguments to the Solid Queue CLI"
status: draft
updated: 2026-11-01
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

`bin/jobs` passes `"$@"`, but `lib/jobs.ts` calls `new Cli().start()` and drops them, so `-c` and `--skip-recurring` are silently ignored. Rails does `SolidQueue::Cli.start(ARGV)` (`solid_queue/v1.1.3/lib/generators/solid_queue/install/templates/bin/jobs:6`).

Thor in trails has a `start(givenArgs)` (`packages/thor/src/base.ts`), so this looks like a trailmap fix, but that it works for `Cli` is unverified. If it does not, the fix belongs in trails.

Expected: `bin/jobs -c <file>` reads that file, with a test.
