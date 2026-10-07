---
title: "activerecord: Timezone#initialize wraps the includer's construction instead of running at Value's super site"
status: in-progress
updated: 2026-10-07
rfc: "0181-activerecord-member-placement"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8638
claim: "2026-10-07T15:03:12Z"
assignee: "sqlite3-adapter-delegation-wrappers-over-mixin-functions"
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Type::Internal::Timezone#initialize`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/type/internal/timezone.rb:7-10`) is

```ruby
def initialize(timezone: nil, **kwargs)
  super(**kwargs)
  @timezone = timezone
end
```

and the three includers, `Type::DateTime`, `Type::Date` and `Type::Time`
(`type/date_time.rb`, `type/date.rb`, `type/time.rb`), define no `initialize`.

trails#8615 moved the body into `Timezone`'s `static *[initialize]` hook
(`packages/activerecord/src/type/internal/timezone.ts`), but two deviations
remain:

- **Each includer still has a constructor**, a bare `super(kwargs)` typed
  `TimezoneOptions` (`packages/activerecord/src/type/date-time.ts`, `date.ts`,
  `time.ts`). Removing it makes `new DateTime({ timezone })` fail with
  `TS2353: Object literal may only specify known properties, and 'timezone'
does not exist in type '{ precision?: ...; limit?: ...; scale?: ...; }'`,
  because an interface merge cannot carry a construct signature.
- **The hook wraps nothing.** It runs where `ActiveModel::Type::Value`'s
  constructor calls `initializeIncludedModules(this, kwargs)`
  (`packages/activemodel/src/type/value.ts`), i.e. before `Value` assigns
  `@precision` / `@scale` / `@limit`, and `Value` still receives `timezone`
  in its kwargs where Rails strips it with `super(**kwargs)`. `Value` hands
  its whole kwargs hash to every module hook to make this work, where Rails'
  `Value#initialize` calls `super()` with no arguments
  (`activemodel/lib/active_model/type/value.rb`).

This is the same wall as the blocked
`activerecord-core-initialize-body-inlined-in-base-constructor` and
`activemodel-api-initialize-concern-constructor`: ruby-compat's module
`[initialize]` hook runs at the root's `super` site, not around the includer's
constructor.

## Acceptance criteria

- [ ] `Timezone#initialize` wraps the includer's construction as
      `timezone.rb:7-10` does: `timezone` is stripped before `Value` sees the
      kwargs, and `@timezone` is assigned after `Value#initialize` returns.
- [ ] `Type::DateTime`, `Type::Date` and `Type::Time` declare no constructor,
      and `new DateTime({ timezone: "utc" })` still type-checks.
- [ ] `Value`'s constructor calls `initializeIncludedModules(this)` with no
      arguments again, matching `super()` in `type/value.rb`.
- [ ] `pnpm parity:api:extra --package activerecord` reports no `timezone.rb`
      inlined-from row, and `packages/activerecord/src/type/` tests stay green.
