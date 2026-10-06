---
title: "Logger#initialize drops ::Logger's kwargs; BroadcastLogger inherits Logger"
status: draft
updated: 2026-10-06
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: ["activesupport"]
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

`ActiveSupport::Logger#initialize(*args, **kwargs)`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/logger.rb:33-36`) is
`super` then `@formatter ||= SimpleFormatter.new`, so it takes everything
`::Logger#initialize` takes (`vendor/ruby/v3.3.11/lib/logger.rb:578-594`):
`logdev, shift_age = 0, shift_size = 1048576, level: DEBUG, progname: nil,
formatter: nil, datetime_format: nil, binmode: false, shift_period_suffix:`,
assigned in that order (`self.level`, `self.progname`, `@default_formatter`,
`self.datetime_format`, `self.formatter`, then the `LogDevice`).

`packages/activesupport/src/logger.ts`'s constructor (trails PR 8569) takes
`...args: [output?, kwargs?: { level? }]` and honours only `level:`. `progname:`,
`formatter:` and `datetime_format:` are silently dropped, and the level is
assigned only when the key is present because `BroadcastLogger` extends
`Logger` in trails and its `level=` broadcasts before `broadcasts` is set;
Rails' `BroadcastLogger` (`broadcast_logger.rb:74`) is a plain class that
includes `ActiveSupport::LoggerSilence` and does not inherit from `Logger`.

## Acceptance criteria

- [ ] The constructor accepts `progname:`, `formatter:` and `datetime_format:`
      and assigns them in `::Logger#initialize`'s order.
- [ ] `BroadcastLogger` no longer extends `Logger`, so the base constructor can
      assign `level` unconditionally as `logger.rb:581` does.
- [ ] `logger.test.ts` and `broadcast-logger.test.ts` stay green.
