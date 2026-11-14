---
title: "Generators stop voiding sourceRoot"
status: done
updated: 2026-11-14
rfc: "0234-no-void-promises"
cluster: discarded-calls
packages: [trailties, actionmailbox, solid-cable, solid-queue, website]
deps: [no-floating-promises-repo-wide-ignore-void-false]
deps-rfc: []
est-loc: 250
priority: null
pr: trails#10067
claim: "2026-11-13T18:49:49Z"
assignee: "generators-await-source-root"
blocked-by: null
closed-reason: null
---

## Context

17 trailties generators (`trailties/lib/generators/test-unit/*`,
`active-record/application-record`, `active-record/multi-db`) plus
`actionmailbox` (`src/generators/action-mailbox/install/install-generator.ts:6`,
`src/trails/generators/mailbox/mailbox-generator.ts:9`,
`src/trails/generators/test-unit/mailbox/mailbox-generator.ts:9`),
`solid-cable` (`install-generator.ts:6`, `update-generator.ts:15`),
`solid-queue` (`install-generator.ts:7`) and
`website/src/lib/frontiers/vfs-generator.ts:261` call
`void this.sourceRoot(...)`. `Base.sourceRoot` is `static async`
(`trailties/lib/generators/base.ts:181`), as is `Thor::Actions#sourceRoot`
(`thor/lib/actions.ts:110`). Rails' `source_root` is a synchronous reader and
writer.

## Acceptance criteria

- [ ] Find why `sourceRoot` is async. If nothing needs it, the writer arm is synchronous as in Rails; otherwise it is awaited in the generator's load step.
- [ ] Zero `void this.sourceRoot` remain.

## Definition of done

An `eslint-disable`, a receipt tag, or a raised mark does not close this story.
