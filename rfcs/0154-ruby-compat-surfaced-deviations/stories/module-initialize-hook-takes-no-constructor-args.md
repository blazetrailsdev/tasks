---
title: "Module initialize hook takes no constructor args, so AR Type::Date/DateTime/Time each repeat Internal::Timezone#initialize"
status: draft
updated: 2026-09-26
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in trails#8114 (story `type-helpers-timezone-is-free-functions-not-a-module`).

Rails' `ActiveRecord::Type::Internal::Timezone` defines `initialize(timezone: nil, **kwargs)`, which calls `super(**kwargs)` and then sets `@timezone = timezone` (`vendor/rails/v8.0.2/activerecord/lib/active_record/type/internal/timezone.rb:7-10`). The module is included into `Type::Date`, `Type::DateTime` and `Type::Time`, which define no `initialize` of their own (`activerecord/lib/active_record/type/date.rb`, `date_time.rb`, `time.rb`).

In trails, `include(Date, Timezone)` installs `isUtc` / `defaultTimezone` from the module. The initializer body cannot come along, because ruby-compat's `[initialize]` hook (`packages/ruby-compat/src/include.ts:443`, run by `initializeIncludedModules` at `:465-484`) is called with no arguments (`initializer.call(instance)`). So each of `packages/activerecord/src/type/{date,date-time,time}.ts` repeats the module's `initialize` as its own constructor: `constructor({ timezone, ...kwargs }: TimezoneOptions = {}) { super(kwargs); this._timezone = timezone; }`.

## Converged shape

Let a module `initialize` receive the constructor's arguments and hand the remaining kwargs to `super`, the way Ruby's `super(**kwargs)` chain threads them. `Internal::Timezone` (`packages/activerecord/src/type/internal/timezone.ts`) then carries the one `initialize` body, and the three AR type classes define no constructor, as in Rails.

## Acceptance criteria

- `packages/activerecord/src/type/internal/timezone.ts` defines the `initialize(timezone, **kwargs)` body once, and `Date` / `DateTime` / `Time` in `packages/activerecord/src/type/` define no constructor.
- `new DateTime({ timezone: "local", precision: 6 })` still gives `defaultTimezone === "local"` and `precision === 6`, and `timezone` does not reach the ActiveModel `Value` constructor.
- `pnpm parity:api:calls`, `parity:api:calls:args` and `parity:api:extra:gate` are green.
