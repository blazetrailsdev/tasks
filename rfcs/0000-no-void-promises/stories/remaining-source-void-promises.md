---
title: "The remaining source sites in rake, ruby-compat, trailties, thor, mail, arel, actionview and others stop dropping promises"
status: draft
updated: 2026-11-12
rfc: "0000-no-void-promises"
cluster: discarded-calls
packages: []
deps: [no-floating-promises-repo-wide-ignore-void-false, no-swallowed-rejection-lint-rule]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC § Design 3, the source sites no other story names:
`rake/lib/{application.ts:245,early-time.ts:16,late-time.ts:16,packagetask.ts:117,task-manager.ts:361}`,
`ruby-compat/lib/{enumerable.ts:1025,string/method-table.ts:449}`,
`trailties/lib/database.ts:317-319`,
`trailties/lib/engine/lazy-route-set.ts:20,30,71,79,89,94,105`,
`thor/lib/actions/directory.ts:44`, `mail/lib/elements/message-ids-element.ts:7`,
`mail/lib/matchers/has-sent-mail.ts:26`, `arel/lib/predications.ts:459,464`,
`actionview/lib/renderer/collection-renderer.ts:257`,
`activestorage/lib/attached/one.ts:62`, `mini-magick/lib/image.ts:151`,
`trails-tsc/lib/plugins/tse-diagnose.ts:40`, plus the four non-Mutex lint
findings (`actionpack/lib/action-dispatch/middleware/debug-view.ts:37`,
`activesupport/lib/benchmarkable.ts:84`, `activesupport/lib/callbacks.ts:566`,
`trailties/lib/commands/version.ts:10`). Some `void`s are on non-promises.

## Acceptance criteria

- [ ] Each site awaits or returns its promise, or drops a non-promise `void`.
- [ ] Every package's source mark reads 0 once this and the other source stories land.

## Definition of done

An `eslint-disable`, a receipt tag, or a raised mark does not close this story.
