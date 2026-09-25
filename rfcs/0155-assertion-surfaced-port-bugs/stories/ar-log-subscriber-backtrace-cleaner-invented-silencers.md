---
title: "AR LogSubscriber backtrace_cleaner is a plain class_attribute BacktraceCleaner.new"
status: claimed
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: "2026-09-25T18:51:40Z"
assignee: "initialize-cache-skips-lookup-store-so-generated-cache-store-is-omitted"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while auditing `BacktraceCleaner` consumers for
`backtrace-cleaner-has-no-default-gem-and-stdlib-silencers` (trails#8045).

Rails' `ActiveRecord::LogSubscriber` declares
`class_attribute :backtrace_cleaner, default: ActiveSupport::BacktraceCleaner.new`
(`activerecord/lib/active_record/log_subscriber.rb:7`): a plain cleaner carrying
only the ActiveSupport defaults (core / gem / stdlib silencers, gem filter, now
ported by trails#8045).

trails' `LogSubscriber._backtraceCleaner` (`packages/activerecord/src/log-subscriber.ts:142-153`)
builds a cleaner and adds an invented `^at\s+` filter plus a silencer for lines
containing `log-subscriber`, `LogSubscriber`, `notifications` or `node_modules`.
None of that is in Rails. It is also a private static plus a getter, not a
`class_attribute`.

## Acceptance criteria

- [ ] `backtraceCleaner` is a `classAttribute` defaulting to `new BacktraceCleaner()`,
      per `log_subscriber.rb:7`, with no extra filters or silencers.
- [ ] If verbose-query-log frames then point into the framework, fix it where
      Rails does (`query_source_location`, `log_subscriber.rb:127-135`), not by
      re-adding silencers.
