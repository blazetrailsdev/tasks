---
title: "frameworks-test-use-frameworks-and-active-support-bare"
status: in-progress
updated: 2026-11-10
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9939
claim: "2026-11-10T00:17:28Z"
assignee: "frameworks-test-use-frameworks-and-active-support-bare"
blocked-by: null
closed-reason: null
---

## Context

Three `FrameworksTest` tests in `packages/trailties/test/application/initializers/frameworks.test.ts` stay skipped:

- "if there's no config.active_support.bare, all of ActiveSupport is required" and "config.active_support.bare does not require all of ActiveSupport" (`vendor/rails/v8.0.2/railties/test/application/initializers/frameworks_test.rb:186-201`). They assert `[1, 2, 3].sample` works and `"hello".exclude? "lo"` raises `NoMethodError` under `active_support.bare`. trails installs no core_ext onto `Array.prototype` / `String.prototype`, so both arms need an owner decision (port the `active_support.bare` require arm of `railties/lib/rails/application/bootstrap.rb` / `active_support/railtie.rb`, or a PERMANENT ruling).
- "database middleware doesn't initialize when activerecord is not in frameworks" (`frameworks_test.rb:209-213`): `assert !defined?(ActiveRecord::Base) || ActiveRecord.autoload?(:Base)`. The test harness's `useFrameworks` (`packages/trailties/test/support/isolation/abstract-unit.ts:430-442`) only strips `config.activeRecord` lines; Rails' `use_frameworks` (`railties/test/isolation/abstract_unit.rb`) also rewrites `config/application.rb`'s `require "rails/all"` to per-framework requires, and the trails test file itself imports `@blazetrails/activerecord`, so `ActiveRecord::Base` is always defined.

## Acceptance criteria

- `useFrameworks` mirrors Rails' (removes the framework requires from the generated `config/application.ts`).
- The three tests are ported with their Rails names, or closed PERMANENT by owner ruling with `PERMANENT-SKIP:` lines.
