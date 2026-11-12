---
title: "activerecord-converge-pinned-protocol-body-divergences"
status: draft
updated: 2026-11-12
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while verifying the protocol-body pins (`activerecord-verify-and-pin-protocol-bodies`).
These pinned pairs still diverge from their Rails body:

- `ActiveRecord::Core#init_with` (`vendor/rails/v8.0.2/activerecord/lib/active_record/core.rb:498-502`):
  `packages/activerecord/lib/core.ts` `initWith` adds a loop defining attribute methods on the
  record's singleton class for each decoded attribute name; Rails has no such loop.
- `ActiveRecord::Core#pretty_print` (`core.rb:798-819`): the TS `prettyPrint` writes
  `pp.text(this.inspect())` where Rails calls `super`, and inverts the `if @attributes` guard
  into an early return.
- `ActiveRecord::Relation#initialize_copy` (`relation.rb:97-100`): `relation.ts` `initializeCopy`
  additionally copies the invented `_fromLimitedIds` and returns `this`.
- `ConnectionAdapters::Column#init_with` (`connection_adapters/column.rb:46-54`) and the
  PostgreSQL / SQLite3 overrides (`postgresql/column.rb:50-55`, `sqlite3/column.rb:36-39`):
  the TS ports substitute `?? null` / `?? false` defaults for a missing coder key where Ruby
  assigns the raw `coder[...]` value (`nil`).
- `Timestamp::ClassMethods#current_time_from_proper_timezone` (`timestamp.rb:79-81`): the TS body
  builds the time from `currentTimeInstant()` via `RubyTime.at(Rational)` and calls `getlocal()`
  where Rails reads `Time.now` / `Time.now.utc`; converge once `Time.now` honours `travel_to`.

## Acceptance criteria

- Each body above matches its Rails body line for line.
- The pins stay green (`pnpm parity:api && pnpm parity:api:pins`), re-pinned where a digest moves.
