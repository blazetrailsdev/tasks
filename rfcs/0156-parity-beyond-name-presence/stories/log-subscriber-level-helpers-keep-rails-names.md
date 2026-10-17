---
title: "log-subscriber-level-helpers-keep-rails-names"
status: ready
updated: 2026-10-17
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 0
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::LogSubscriber` defines its level helpers as private instance
methods named after the level (`vendor/rails/v8.0.2/activesupport/lib/active_support/log_subscriber.rb:160-167`):

```ruby
%w(info debug warn error fatal unknown).each do |level|
  def #{level}(progname = nil, &block)
    logger.#{level}(progname, &block) if logger
  end
end
```

trails spells them `_info` / `_debug` / `_warn` / `_error` / `_fatal` /
`_unknown` (`packages/activesupport/src/log-subscriber.ts:178-212`), takes no
block, and answers `false` where Rails answers `nil` with no logger. Subclasses
call them as `this._info(...)` (actionpack action-controller and action-dispatch
`log-subscriber.ts`, actionview `log-subscriber.ts`, activerecord
`log-subscriber.ts`; 19 call sites).

A subclass that overrides one cannot reach it: `ActiveJob::LogSubscriber`
overrides `info` and `error` and calls `super`
(`vendor/rails/v8.0.2/activejob/lib/active_job/log_subscriber.rb:181-193`), so a
faithful TS port's `super.info(progname, block)` has nothing to call. Surfaced
by the Ruby→TS codegen spike's activejob trial (tsc: "Property 'info' does not
exist on type 'LogSubscriber'. Did you mean '\_info'?").

## Acceptance criteria

- `ActiveSupport::LogSubscriber` has protected `info`, `debug`, `warn`,
  `error`, `fatal`, `unknown` at the Rails names, each `(progname = null,
block?)`, calling `this.logger.<level>(progname, block)` only when there is a
  logger and answering `null` otherwise.
- The `_`-prefixed spellings are removed and all 19 call sites use the Rails
  names.
- A subclass overriding `info` can call `super.info(progname, block)`.
- The touched packages' log subscriber tests pass; `parity:api` for
  activesupport credits the six methods.
