---
title: "solid-cable reaches 100% on parity:test and parity:api after the v3.0.12 bump"
status: done
updated: 2026-11-26
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["solid-cable", "ruby-compat"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#10795
claim: "2026-11-26T12:09:16Z"
assignee: "solid-cable-parity-100-after-3-0-12-bump"
blocked-by: null
closed-reason: null
---

## Context

After `bump-solid-cable-to-3-0-12`, solid-cable measured 22/23 tests and 21/23 methods.

- Test `does not send old messages`
  (`vendor/solid_cable/v3.0.12/test/lib/action_cable/subscription_adapter/solid_cable_test.rb:151`)
  was not ported. Porting it shows `ThreadPoolExecutor#post`
  (`packages/ruby-compat/lib/thread-pool-executor.ts`) starting tasks out of post order:
  a new worker Thread runs its first task synchronously, while an idle worker resumes a
  microtask later. concurrent-ruby's `Worker#<<` hands every task through a queue.
- `generators/solid_cable/update/templates/db/migrate/create_compact_channel.rb`
  (`up` / `down`) is unscored because the port is a `.ts.tt` template.
- `ActiveRecord::Migration[7.2]` superclasses and `scope :x, lambda { |a, b| }` params
  are misread by the extractors.

## Acceptance criteria

- `pnpm parity:test --package solid-cable` is 23/23.
- `pnpm parity:api --package solid-cable` is 100% on methods, files, inheritance and arity.
- The pool starts tasks in post order, with a regression test.
