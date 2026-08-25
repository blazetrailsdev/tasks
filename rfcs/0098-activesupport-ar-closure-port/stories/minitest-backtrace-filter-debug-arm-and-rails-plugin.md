---
title: "BacktraceFilter drops minitest's MT_DEBUG arm and nothing assigns Minitest.backtraceFilter"
status: done
updated: 2026-08-14
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6499
claim: "2026-08-13T23:57:08Z"
assignee: "converge-strict-loading-violation-signature"
blocked-by: null
closed-reason: null
---

## Context

PR #6495 ported `Minitest::BacktraceFilter` as a class with a settable
`Minitest.backtraceFilter` (`packages/activesupport/src/testing/assertions.ts`),
mirroring minitest-6.0.0 `lib/minitest.rb:1173-1199` and `:43` / `:365-369`.

Two arms of the Ruby body are still missing:

1. `BacktraceFilter#filter`'s debug escape hatch (minitest.rb:1187):

   ```ruby
   return bt.dup if $DEBUG || ENV["MT_DEBUG"]
   ```

   trails drops it entirely with a call-site note, because the repo's rules keep
   `process.*` out of runtime code. `packages/activesupport/src/process-adapter.ts`
   already exposes the env through an adapter, which is the shape this arm should
   use — `$DEBUG` has no JS analogue and is the only genuinely unportable half.

2. Rails itself REASSIGNS the filter in
   `railties/lib/minitest/rails_plugin.rb` (`Minitest.backtrace_filter =
Rails.backtrace_cleaner` under `plugin_rails_init`), which is what makes a
   Rails test's trace app-relative. trails now has the settable seat but nothing
   assigns it, so no ported Rails code exercises the accessor.

## Converged shape

Port the `MT_DEBUG` arm through `process-adapter`, and port
`rails_plugin.rb`'s assignment of `Minitest.backtrace_filter` (or file the
`Rails.backtrace_cleaner` dependency it needs) so the accessor has its Rails
caller.

## Acceptance criteria

- [ ] `BacktraceFilter#filter` returns the whole trace under `MT_DEBUG`, read
      through `process-adapter`, matching minitest.rb:1187.
- [ ] The `$DEBUG` half is cited at the call site as the unportable one.
- [ ] `rails_plugin.rb`'s `Minitest.backtrace_filter =` assignment is ported, or
      a story is filed for the `Rails.backtrace_cleaner` it needs.
