---
title: "port-the-fragment-cache-log-subscriber-methods"
status: ready
updated: 2026-09-04
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 24
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionController::LogSubscriber`
(`vendor/rails/actionpack/lib/action_controller/log_subscriber.rb:80-88`)
defines four logging methods through `class_eval` in a
`%w(write_fragment read_fragment exist_fragment? expire_fragment).each` loop:

```ruby
def #{method}(event)
  return unless ActionController::Base.enable_fragment_cache_logging
  key         = ActiveSupport::Cache.expand_cache_key(event.payload[:key] || event.payload[:path])
  human_name  = #{method.to_s.humanize.inspect}
  info("#{human_name} #{key} (#{event.duration.round(1)}ms)")
end
subscribe_log_level :#{method}, :info
```

`packages/actionpack/src/action-controller/log-subscriber.ts` has no
counterpart for any of the four bodies, so
`port-log-subscriber-remaining-subscribe-log-level` could not register their
levels either — registering a level for a method the port does not define
silences nothing. The bottom of that file carries a comment pointing here.

Both halves are needed together: the four bodies, and their four
`LogSubscriber.subscribeLogLevel("<method>", "info")` registrations.

`ActiveSupport::Cache.expand_cache_key`
(`vendor/rails/activesupport/lib/active_support/cache.rb`) and
`ActionController::Base.enable_fragment_cache_logging`
(`vendor/rails/actionpack/lib/action_controller/metal/caching.rb`) both need to
be reachable from the port; check each before starting.

## Acceptance criteria

- `writeFragment`, `readFragment`, `existFragment`, `expireFragment` exist on
  `packages/actionpack/src/action-controller/log-subscriber.ts`, each mirroring
  the `class_eval` body line for line, including the
  `enable_fragment_cache_logging` early return and the humanized name.
- Each has a `LogSubscriber.subscribeLogLevel("<ruby_method>", "info")`
  registration, and the pointer comment at the bottom of the file is deleted.
- `pnpm parity:api:calls` shows no new rows; the actionpack suite is green.
