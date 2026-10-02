---
title: "activerecord: LogSubscriber overrides debug; debugSql and the exported debug function go"
status: draft
updated: 2026-10-02
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::LogSubscriber` overrides `debug` (`vendor/rails/v8.0.2/activerecord/lib/active_record/log_subscriber.rb:113-119`):

```ruby
def debug(progname = nil, &block)
  return unless super

  if ActiveRecord.verbose_query_logs
    log_query_source
  end
end
```

`packages/activerecord/src/log-subscriber.ts` has no `debug` override. `sql` calls a `debugSql(message)`
method that looks the logger up itself and returns `false` without one, and a separate exported top-level
`debug(subscriber, message)` function repeats the body with an inlined `log_query_source`.
trails#8419 made `sql` return `debugSql`'s value (`log_subscriber.rb:59`), so `sql` answers `false` where
Rails' `debug` answers nil.

## Acceptance criteria

- [ ] `LogSubscriber#debug(progname, block)` overrides the ActiveSupport method: `return` unless `super`,
      then `logQuerySource()` under `verboseQueryLogs()`.
- [ ] `debugSql` and the exported `debug` function are deleted, and `sql` ends in `this.debug(...)`.
- [ ] `strictLoadingViolation` goes through the same `debug`.
