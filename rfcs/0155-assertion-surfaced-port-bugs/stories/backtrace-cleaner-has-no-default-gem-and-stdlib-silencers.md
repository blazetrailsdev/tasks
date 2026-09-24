---
title: "backtrace-cleaner-has-no-default-gem-and-stdlib-silencers"
status: in-progress
updated: 2026-09-24
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8045
claim: "2026-09-24T17:59:05Z"
assignee: "aes256-gcm-inspect-not-rails-format"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `assertions-activesupport-loggers-cluster` (RFC 0132) review on trails#7945.
Parked in `packages/activesupport/src/backtrace-cleaner.test.ts`
(`BacktraceCleanerDefaultFilterAndSilencerTest`): `should silence gems from the
backtrace`, `should silence stdlib`.

Rails `activesupport/test/backtrace_cleaner_test.rb:94-136` uses
`ActiveSupport::BacktraceCleaner.new`, whose `initialize` calls
`add_gem_filter`, `add_gem_silencer`, `add_stdlib_silencer`
(`activesupport/lib/active_support/backtrace_cleaner.rb`), and builds paths
from `Gem.path` / `RbConfig::CONFIG["rubylibdir"]`. trails' `BacktraceCleaner`
constructor installs no defaults, and the rest of that describe block tests a
local fake cleaner (`makeBacktraceCleaner`) rather than the production class.

## Acceptance criteria

- [ ] `BacktraceCleaner` installs Rails' default gem filter / gem silencer / stdlib silencer (with a node-equivalent of Gem.path / rubylibdir).
- [ ] The describe block exercises the production class; the fake is removed.
- [ ] The two parked tests are un-skipped and pass with runtime-derived paths.
