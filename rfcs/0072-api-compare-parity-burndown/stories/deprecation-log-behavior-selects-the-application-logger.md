---
title: "Deprecation's :log behavior selects Rails.logger before the stderr fallback"
status: done
updated: 2026-08-09
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6282
claim: "2026-08-09T15:40:10Z"
assignee: "mysql-schema-creation-quoted-columns-reimplements-the-delegated-decoration"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while porting `DEFAULT_BEHAVIORS` in PR #6279.

Rails' `:log` behavior (`activesupport/lib/active_support/deprecation/behaviors.rb:26-34`)
picks `Rails.logger` when it is defined and truthy, and only otherwise falls
back to `ActiveSupport::Logger.new($stderr)`:

```ruby
logger =
    if defined?(Rails.logger) && Rails.logger
      Rails.logger
    else
      require "active_support/logger"
      ActiveSupport::Logger.new($stderr)
    end
logger.warn message
logger.debug callstack.join("\n  ") if deprecator.debug
```

PR #6279's port takes the fallback branch unconditionally and writes to
`stderr` directly rather than through a Logger, because activesupport has no
handle on a process-wide logger — trailties owns `Trails.logger`. The
`deprecator.debug` guard IS ported; only the logger selection and the
`warn`/`debug` level split are not. The reason is recorded in the
`DEFAULT_BEHAVIORS` JSDoc.

## Converged shape

The entry names both branches: `Trails.logger` when set (reachable from
activesupport the same way any other cross-package late binding is — a slot or
the existing logger registry, whichever the repo already uses), else
`new Logger(stderr)` from `activesupport/src/logger.ts`. Levels are `warn` for
the message and `debug` for the callstack, not two bare writes.

## Acceptance criteria

- [ ] `:log` selects the application logger when one is set, and only falls
      back to a stderr Logger otherwise (`behaviors.rb:26-31`).
- [ ] The message goes through `logger.warn` and the callstack through
      `logger.debug` (`behaviors.rb:32-33`).
- [ ] No new invented indirection: the selection is the two Rails branches.
