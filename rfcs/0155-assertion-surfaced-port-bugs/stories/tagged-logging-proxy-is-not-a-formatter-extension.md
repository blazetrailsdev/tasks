---
title: "tagged-logging-proxy-is-not-a-formatter-extension"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `assertions-activesupport-loggers-cluster` (RFC 0132). Parked in
`packages/activesupport/src/tagged-logging.test.ts` (TaggedLoggingTest):

- `sets logger.formatter if missing and extends it with a tagging API`
  (`tagged_logging_test.rb:17-23`: `other_logger.formatter` not nil and
  `respond_to? :tagged`)
- `does not share the same formatter instance of the original logger`
  (`:112-124`, expects `[OMG] Cool story\n[BCX] Funky time\n`; port emits
  `[OMG] [BCX] Funky time`)
- `keeps each tag in their own thread` (`:79-89`)
- `keeps each tag in their own thread even when pushed directly` (`:91-98`)

Rails `TaggedLogging.new` dups the logger, dups+extends its formatter with
`Formatter`, and keeps tags in `LocalTagStorage` keyed by
`IsolatedExecutionState` (`activesupport/lib/active_support/tagged_logging.rb`).
trails' `taggedLogging` (`logger.ts` `makeTaggedProxy`) is a wrapper object
with one shared `tagStack` array, not thread/fiber-local, and wrapping a tagged
logger re-applies the outer tags. `tagged-logging.ts` already has `TagStack` /
`Formatter` / `LocalTagStorage` pieces that are not wired in.

## Acceptance criteria

- [ ] TaggedLogging extends the formatter (Rails shape) with per-execution-state tag storage.
- [ ] The four parked tests are un-skipped and pass.
