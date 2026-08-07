---
title: "Delegate isPreventingWrites to ConnectionDescriptor#currentPreventingWrites instead of re-walking the stack"
status: done
updated: 2026-08-07
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 110
priority: null
pr: 6188
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced on PR #5620 (story `converge-adapter-prevent-writes-tests-onto-pooled-scope`,
RFC 0005), which retired the three invented `preventWrites` short-circuits from
`AbstractAdapter#isPreventingWrites`. What remains is the descriptor path, but
trails reaches it by a different route than Rails.

Rails splits this across three definitions:

- `preventing_writes?`
  (`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:227-232`)
  is three lines and **delegates**: `connection_descriptor.current_preventing_writes`.
- `ConnectionDescriptor#current_preventing_writes`
  (`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/connection_handler.rb:71-73`)
  is `ActiveRecord::Base.preventing_writes?(@name)`.
- `Base.preventing_writes?(class_name)` (`vendor/rails/activerecord/lib/active_record/core.rb:207-214`)
  walks `connected_to_stack.reverse_each`, returning `hash[:prevent_writes]` when
  `klasses.include?(Base)` or `klasses.any? { |klass| klass.name == class_name }`.

trails already has a faithful port of the third one —
`isPreventingWrites(className)` at `packages/activerecord/src/core.ts:568-582`.
But `AbstractAdapter#isPreventingWrites`
(`packages/activerecord/src/connection-adapters/abstract-adapter.ts:1417-1462`)
**re-implements that walk inline** rather than delegating, so the stack walk
exists twice. The adapter copy also carries an invention the `core.ts` copy does
not: it derives `ownerName` from `pool?.poolConfig?.connectionDescriptor?.name`
and then normalizes each candidate with
`typeof k.primaryClassQ === "function" && k.primaryClassQ() ? "Base" : k.name`.
Rails' `core.rb:213` is a plain `klass.name == class_name` compare with no
primary-class promotion.

Relatedly, `get connectionDescriptor()`
(`abstract-adapter.ts:1785-1787`) returns `unknown` — `(this.pool as any)?.connectionDescriptor ?? null`.
There is no real `ConnectionDescriptor` with a `currentPreventingWrites` method
to delegate to, which is why the adapter inlines the walk in the first place.

## Acceptance criteria

- `ConnectionDescriptor` (in `connection-adapters/abstract/connection-handler.ts`,
  Rails' home) gains a real `currentPreventingWrites()` that calls
  `Base.isPreventingWrites(name)`, mirroring `connection_handler.rb:71-73`.
- `get connectionDescriptor()` returns that type rather than `unknown`.
- `AbstractAdapter#isPreventingWrites` collapses to Rails' three lines:
  `replica?`, `connection_descriptor.nil?`, then
  `connectionDescriptor.currentPreventingWrites()`. The duplicated stack walk in
  `abstract-adapter.ts` is deleted.
- Assess the invented `primaryClassQ() ? "Base" : k.name` normalization against
  Rails' plain name compare (`core.rb:213`). If any suite depends on it, capture
  which and why at the call site; if none does, drop it so `core.ts`'s walk is the
  single faithful implementation.
- Prevent-writes suites stay green on sqlite, PG and MariaDB:
  `adapter-prevent-writes`, `base-prevent-writes`,
  `adapters/postgresql/postgresql-adapter-prevent-writes`,
  `adapters/sqlite3/sqlite3-adapter-prevent-writes`,
  `adapters/abstract-mysql-adapter/adapter-prevent-writes`,
  `abstract-adapter-preventing-writes.trails`, `connection-handling`,
  `connection-swapping-nested`, `database-selector`, `shard-keys`.
