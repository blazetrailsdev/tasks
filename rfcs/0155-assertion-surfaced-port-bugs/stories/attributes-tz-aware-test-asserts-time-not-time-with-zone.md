---
title: "time zone aware attribute asserts Time where Rails asserts TimeWithZone"
status: claimed
updated: 2026-09-24
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-09-24T17:59:05Z"
assignee: "aes256-gcm-inspect-not-rails-format"
blocked-by: null
closed-reason: null
---

## Context

Shipped in trails#7911 (`assertions-tail-root-2-rem`) and wrong at the class
level, though the assertion-kind gate is green because `instanceOf` matches
`instanceOf`.

Rails' `attributes_test.rb:103-120`:

```ruby
klass = Class.new(OverloadedType) do
  attribute :starts_at, :datetime, precision: 3, default: -> { Time.now.utc }
  attribute :ends_at, default: -> { Time.now.utc }
end
...
assert_instance_of ActiveSupport::TimeWithZone, klass.new.starts_at
assert_instance_of ActiveSupport::TimeWithZone, klass.new.ends_at
```

`packages/activerecord/src/attributes.test.ts`'s `time zone aware attribute`
declares both attributes with `default: () => new Date()` and then asserts
`toBeInstanceOf(Time)`, not `TimeWithZone`.

The `Time` is a consequence of the `new Date()`, not a trails limitation.
Probed on this branch, with `TimeZoneConverter` applied either way:

| default                        | `klass.new.starts_at` constructor |
| ------------------------------ | --------------------------------- |
| `() => new Date()`             | `Time`                            |
| `() => Temporal.Now.instant()` | `TimeWithZone`                    |

`Temporal.Now.instant()` is the port of Rails' `Time.now.utc`, and it already
produces the class Rails asserts. So this converges by fixing the test, with no
src change: use `Temporal.Now.instant()` for both defaults and assert
`TimeWithZone` (from `@blazetrails/activesupport`) in both value assertions.

While there, `starts_at` should carry Rails' `precision: 3`
(`attributes_test.rb:106`) — `AttributeOptions` gained `precision`/`scale` in
trails#7911, so it is expressible now.

Two adjacent things to check rather than assume:

- Rails wraps the body in `with_timezone_config aware_attributes: true, zone:
"Pacific Time (US & Canada)"`; the port uses `inTimeZone(...)`
  (`packages/activerecord/src/cases/helper.ts`), which sets the zone only. The
  converter is applied regardless, so `aware_attributes` is evidently on
  suite-wide — confirm that, and if `inTimeZone` has no `aware_attributes` arm,
  decide whether `with_timezone_config` wants porting.
- `ends_at` is declared with no type in Rails (`attribute :ends_at, default:
…`); the port passes `"datetime"`. Check whether trails needs the explicit
  type, and file separately if it does.

## Acceptance criteria

- `time zone aware attribute` uses `Temporal.Now.instant()` defaults,
  `precision: 3` on `starts_at`, and asserts `TimeWithZone` for both values,
  matching `attributes_test.rb:103-120`.
- `attributes_test.rb` reports no new count/kind/value mismatch
  (`pnpm parity:test -- --package activerecord --assertions`).
- The `with_timezone_config` / untyped-`ends_at` questions above are answered,
  and anything left is filed.
