---
title: "Port ActiveSupport::LogSubscriber::TestHelper (MockLogger, set_logger, wait)"
status: draft
updated: 2026-09-29
rfc: "0169-activejob-package-port"
cluster: null
packages: ["activesupport"]
deps: []
deps-rfc: []
est-loc: 200
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activejob/test/cases/logging_test.rb:19` does
`include ActiveSupport::LogSubscriber::TestHelper`. trails has not ported it:
`vendor/rails/v8.0.2/activesupport/lib/active_support/log_subscriber/test_helper.rb`
(106 lines) has no file under `packages/activesupport/src/`, though it is
counted (not unported) in activesupport's population
(`scripts/parity/unported-files/activesupport.ts:84-85`). Three test files each
hand-roll a `MockLogger` instead: `packages/activesupport/src/log-subscriber.test.ts:10`,
`packages/activerecord/src/log-subscriber.test.ts`,
`packages/actionview/src/log-subscriber.trails.test.ts`.

The module: `setup` / `teardown` (`:38-52`); `MockLogger` (`:54-89`) with
`initialize(level = DEBUG)`, `method_missing(level, message = nil)`
(`:66-72`), `logged(level)`, `flush`, and a `#{severity.downcase}?`
predicate per severity (`:84`); `wait` (`:92-94`); `set_logger` (`:101-103`).

This is the first consumer. Moving the three local copies onto it is a
follow-up: file it as a story in this RFC from the PR.

## Fidelity traps (predicted at authoring)

- [ ] **`MockLogger#method_missing`.** The CLAUDE.md table (§ "Ruby protocol methods with a different JS mechanism") lists this file as `nothing (no file)`. Recommendation: typed forwarders, one per `Logger::Severity` name, each a `this.methodMissing(name, …)` call as `migration.ts` does; callers use only those six names, so a Proxy adds a per-read cost for no reach.
- [ ] **Severity predicates** (`debug?` …) are `isDebug` …, generated from the severity list, not hand-written.

## Acceptance criteria

- [ ] `packages/activesupport/src/log-subscriber/test-helper.ts` ports every member, and `log_subscriber/test_helper.rb` reads complete in `parity:api`.
- [ ] A test attaches a subscriber, logs at two levels and reads them back through `logged(level)`.
- [ ] The CLAUDE.md `method_missing` table row for `log_subscriber/test_helper.rb` names the chosen shape, and the follow-up story is filed.

## Definition of done

Porting `MockLogger` without updating the CLAUDE.md row, or rewriting the three existing copies in this PR, does not close this story.
