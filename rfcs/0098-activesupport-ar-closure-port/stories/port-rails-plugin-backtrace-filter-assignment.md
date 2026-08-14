---
title: "port-rails-plugin-backtrace-filter-assignment"
status: done
updated: 2026-08-14
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6499
claim: "2026-08-14T00:45:17Z"
assignee: "converge-strict-loading-violation-signature"
blocked-by: null
closed-reason: null
---

# Port `rails_plugin.rb`'s `Minitest.backtrace_filter =` assignment

## Context

`packages/activesupport/src/testing/assertions.ts` now carries
`Minitest::BacktraceFilter` (minitest-6.0.6 `lib/minitest.rb:1173-1201`) with a
settable `Minitest.backtraceFilter` seat (minitest.rb:43, :1204) and, as of the
MT_DEBUG arm, the full `filter` body. Nothing in trails ASSIGNS that seat, so
the accessor has no ported Rails caller.

Rails reassigns it in
`vendor/rails/railties/lib/minitest/rails_plugin.rb:111-120`:

```ruby
def self.plugin_rails_init(options)
  return unless ENV["RAILS_ENV"] || ENV["RAILS_MINITEST_PLUGIN"]

  unless options[:full_backtrace]
    if ::Rails.respond_to?(:backtrace_cleaner)
      Minitest.backtrace_filter = BacktraceFilterWithFallback.new(::Rails.backtrace_cleaner, Minitest.backtrace_filter)
    end
  end
  ...
end
```

That needs two things trails does not have yet:

- `Rails.backtrace_cleaner` (railties `rails/backtrace_cleaner.rb`, exposed off
  the `Rails` module), and
- `Minitest::BacktraceFilterWithFallback` (rails_plugin.rb, wraps a cleaner and
  falls back to the previous filter when the cleaner returns nothing).

## Acceptance criteria

- [ ] `Rails.backtraceCleaner` exists at its Rails path, or is filed/blocked
      with the specific missing dependency.
- [ ] `BacktraceFilterWithFallback` is ported at `minitest/rails_plugin.ts`,
      mirroring rails_plugin.rb.
- [ ] `plugin_rails_init`'s backtrace-filter arm (rails_plugin.rb:112-120)
      assigns `Minitest.backtraceFilter`, including the `RAILS_ENV` /
      `RAILS_MINITEST_PLUGIN` guard and the `full_backtrace` option.
