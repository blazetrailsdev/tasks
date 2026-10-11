---
title: "activerecord: Marshal.load reads the Rails 6.1 and 7.1 marshal compatibility fixtures (4 parked cases)"
status: draft
updated: 2026-10-11
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps:
  - marshal-cannot-dump-a-plain-date-time-or-time-seat
deps-rfc: []
est-loc: 700
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `activerecord-port-marshal-excluded-tests`. Rails' four
`test_deserializing_rails_*` cases
(`vendor/rails/v8.0.2/activerecord/test/cases/marshal_serialization_test.rb:18-58`)
`Marshal.load` a dump an older Rails wrote, from
`test/support/marshal_compatibility_fixtures/<adapter_name>/`. The dumps are
vendored into
`packages/activerecord/src/test-helpers/support/marshal_compatibility_fixtures/`
(SQLite, PostgreSQL, Mysql2) and the four cases are parked as `it.skip` under
`BLOCKED: activerecord-load-rails-written-marshal-fixtures` in
`packages/activerecord/src/marshal-serialization.test.ts`.

Where each load stops today:

- `rails_7_1_topic.dump` and `rails_7_1_topic_associations.dump` raise
  `dump format error(0x75)`. The 7.1 payload is `attributes_for_database`, whose
  `written_on` / `created_at` / `updated_at` are `Time` values, written as
  `TYPE_USERDEF` (`u:\tTime`, `vendor/ruby/v3.3.11/marshal.c:2185-2215`) and
  read by `Time._load` (`vendor/ruby/v3.3.11/time.c:5345-5720`).
  `packages/ruby-compat/src/marshal.ts` ports neither;
  `marshal-cannot-dump-a-plain-date-time-or-time-seat` (RFC 0154) owns that
  half. The payload also holds an `ActiveRecord::Type::Time::Value`
  (`U:` with a `[:__v2__, [], [], time]` body, the `DelegateClass`
  `marshal_dump`) and a `Date`.
- `rails_6_1_topic.dump` and `rails_6_1_topic_associations.dump` raise
  `` `excl' is not allowed as an instance variable name ``: a `Range` is dumped
  as `o:\nRange` with the non-`@` members `excl` / `begin` / `end`, which MRI
  loads through `range_loader` (`vendor/ruby/v3.3.11/range.c`). Past that, a
  6.1 dump is the record's whole instance-variable graph under Rails' names:
  `@new_record`, `@attributes` (an `ActiveModel::LazyAttributeSet` with
  `@values`, `@types`, `@additional_types`, `@default_attributes`), type
  objects under their Rails paths
  (`ActiveRecord::ConnectionAdapters::SQLite3Adapter::SQLite3Integer`,
  `ActiveRecord::Type::Serialized`, `ActiveRecord::Coders::YAMLColumn`) and
  `ActiveModel::Attribute::FromDatabase` members. trails names the record's
  members `@_new_record` / `@_attributes`.

## Acceptance criteria

- [ ] The two 7.1 fixture cases are live with Rails' bodies on all three
      adapters.
- [ ] The two 6.1 fixture cases are live with Rails' bodies on all three
      adapters, with the record's members under the names Rails dumps.
- [ ] No `BLOCKED:` line naming this story remains.

## Verification

```bash
pnpm vitest run packages/activerecord/src/marshal-serialization.test.ts
```
