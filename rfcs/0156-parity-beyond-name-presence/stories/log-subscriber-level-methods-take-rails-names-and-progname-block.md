---
title: "ActiveSupport::LogSubscriber level methods take Rails' names and (progname, &block)"
status: draft
updated: 2026-10-06
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActiveSupport::LogSubscriber` generates its level methods at
`vendor/rails/v8.0.2/activesupport/lib/active_support/log_subscriber.rb:161-167`:

```ruby
%w(info debug warn error fatal unknown).each do |level|
  class_eval <<-METHOD, __FILE__, __LINE__ + 1
    def #{level}(progname = nil, &block)
      logger.#{level}(progname, &block) if logger
    end
  METHOD
end
```

trails' `packages/activesupport/src/log-subscriber.ts:178-190` spells them `_info` / `_debug` /
`_warn` / … and merges Rails' two parameters into one `message?: string | (() => string)`.

`ActiveRecord::LogSubscriber#debug` (`activerecord/lib/active_record/log_subscriber.rb:113`,
`packages/activerecord/src/log-subscriber.ts`) is ported at Rails' name and signature as of
trails#8590, but its `super` has to reach `super._debug(block ?? progname ?? undefined)`.
The other callers are `packages/actionview/src/log-subscriber.ts:115,152` and
`packages/actionpack/src/action-controller/log-subscriber.ts:103`.

## Acceptance criteria

- The base methods are `info` / `debug` / `warn` / `error` / `fatal` / `unknown`, each
  `(progname = null, block?)`, forwarding both to the logger as Rails does.
- `ActiveRecord::LogSubscriber#debug` calls `super.debug(progname, block)`.
- Every `_info` / `_debug` / … call site in activesupport, actionview, actionpack and their tests
  is moved to the Rails spelling.
