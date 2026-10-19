---
title: "tagged-logging-new-clones-without-dup-arm"
status: draft
updated: 2026-10-19
rfc: "0101-activesupport-out-of-closure-surface"
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

Rails' `TaggedLogging.new` starts with `logger = logger.clone` (`vendor/rails/v8.0.2/activesupport/lib/active_support/tagged_logging.rb:122`). trails writes `(logger as { dup?: () => Logger }).dup?.() ?? rbObjClone(logger)` (`packages/activesupport/src/tagged-logging.ts:178`): an invented `dup` arm ahead of the clone.

## Acceptance criteria

- `TaggedLogging.new` calls `rbObjClone(logger)` only, as Rails calls `clone`; any logger needing custom copy behaviour gets it through `initializeClone` / `initializeCopy`.
- Existing tagged-logging tests (including the BroadcastLogger clone test) pass.
