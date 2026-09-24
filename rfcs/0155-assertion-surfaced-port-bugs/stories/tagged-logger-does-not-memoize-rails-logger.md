---
title: "testing/tagged-logging taggedLogger() drops the @tagged_logger ||= memo"
status: draft
updated: 2026-09-24
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activesupport/lib/active_support/testing/tagged_logging.rb:22-23`:

    def tagged_logger
      @tagged_logger ||= (defined?(Rails.logger) && Rails.logger)
    end

trails' `taggedLogger()` (`packages/activesupport/src/testing/tagged-logging.ts`) is
`return taggedLoggerValue ?? TopLevel.Trails?.logger ?? null;`. It never writes the memo, so a later
`Rails.logger` reassignment wins retroactively, where Rails keeps the first logger it saw. It also returns `null` for
Rails' `false` / `nil` arm without memoizing it. (Rails' `||=` re-evaluates a nil/false memo, so that arm matches;
the non-nil arm does not.)

## Acceptance criteria

- `taggedLogger()` memoizes the first non-null `TopLevel.Trails?.logger` into `taggedLoggerValue` with `??=`,
  matching `@tagged_logger ||=`.
- A test mirroring the memo (a second `TopLevel.Trails` seat does not win once one was read), in the shape of
  `packages/activesupport/src/log-subscriber.trails.test.ts`'s "memoizes with Rails' `||=`" case.
