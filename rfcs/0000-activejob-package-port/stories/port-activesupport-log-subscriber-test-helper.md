---
title: "Port ActiveSupport::LogSubscriber::TestHelper (MockLogger, set_logger, wait)"
status: draft
updated: 2026-09-29
rfc: "0000-activejob-package-port"
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
`include ActiveSupport::LogSubscriber::TestHelper`. trails has not ported that
module. `vendor/rails/v8.0.2/activesupport/lib/active_support/log_subscriber/test_helper.rb`
(106 lines) has no file under `packages/activesupport/src/`, even though it is
counted in activesupport's `parity:api` population, not unported
(`scripts/parity/unported-files/activesupport.ts:84-85`). Instead, three test
files each hand-roll a `MockLogger`: `packages/activesupport/src/log-subscriber.test.ts:10`,
`packages/activerecord/src/log-subscriber.test.ts` and
`packages/actionview/src/log-subscriber.trails.test.ts`.

The module:

- `setup` / `teardown` (`:38-52`): swap in a `MockLogger`, attach the
  subscriber, and restore.
- `MockLogger` (`:54-89`): `initialize(level = DEBUG)`, and `logged(level)`
  and `flush`, plus a `#{severity.downcase}?` predicate per severity (`:84`).
  It records messages by level through **`method_missing(level, message =
nil)`** (`:66-72`).
- `wait` (`:92-94`) and `set_logger` (`:101-103`).

**`MockLogger#method_missing` needs a decision recorded in CLAUDE.md.** The
table in § "Ruby protocol methods with a different JS mechanism" lists this
file as `nothing (no file)`. Porting it moves the row. The recommendation is
typed forwarders, one per `Logger::Severity` name
(`debug`/`info`/`warn`/`error`/`fatal`/`unknown`), each a
`this.methodMissing(name, …)` call, as `migration.ts` does. A logger's
callers call only those six names, so a Proxy would add a per-read cost for no
reach. Update the CLAUDE.md row in the trails PR.

This is the first consumer. Moving the three hand-rolled copies onto the port
is a follow-up: file it as a story in this RFC from the PR, and do not do it
here.

## Acceptance criteria

- [ ] `packages/activesupport/src/log-subscriber/test-helper.ts` ports every
      member above, and `log_subscriber/test_helper.rb` reads complete in
      `parity:api`.
- [ ] A test attaches a subscriber, logs at two levels, and reads them back
      through `logged(level)`.
- [ ] The CLAUDE.md `method_missing` table row for `log_subscriber/test_helper.rb`
      names the shape chosen.
- [ ] The follow-up story for the three local `MockLogger`s is filed.

## Definition of done

Porting `MockLogger` without updating the CLAUDE.md `method_missing` row does not close this story, and neither does rewriting the three existing `MockLogger` copies in the same PR.
