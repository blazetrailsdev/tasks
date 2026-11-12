---
title: "Generators stop voiding Base.sourceRoot"
status: draft
updated: 2026-11-12
rfc: "0000-no-void-promises"
cluster: discarded-calls
packages: []
deps: [no-floating-promises-repo-wide-ignore-void-false]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

~17 generators call `void this.sourceRoot(File.expandPath("templates", __dir__))`
(e.g. `trailties/lib/generators/test-unit/job/job-generator.ts:10`, the
actionmailbox, solid-queue and solid-cable install generators,
`website/src/lib/frontiers/vfs-generator.ts:261`). `Base.sourceRoot` is
`static async` (`trailties/lib/generators/base.ts:181`), as is
`Thor::Actions#sourceRoot` (`thor/lib/actions.ts:110`). Rails' `source_root`
is a plain class-level reader/writer.

## Acceptance criteria

- [ ] Find why `sourceRoot` is async; make the writer arm synchronous if nothing async is needed, otherwise await it in the generator's awaited load step.
- [ ] Zero `void this.sourceRoot` remain.
