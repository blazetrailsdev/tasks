---
title: "TimeWithZone#+ replaces Rails' duration guard, method_missing and rescue TypeError with a positive type dispatch"
status: done
updated: 2026-09-11
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#7690
claim: "2026-09-11T11:53:31Z"
assignee: "converge-time-with-zone-plus-onto-the-ruby-body"
blocked-by: null
closed-reason: null
---

## Context

`TimeWithZone#+` (`vendor/rails/activesupport/lib/active_support/time_with_zone.rb:298-316`)
is a two-branch body over a `begin/rescue`:

```ruby
def +(other)
  if duration_of_variable_length?(other)
    method_missing(:+, other)
  else
    begin
      result = utc + other
    rescue TypeError
      result = utc.to_datetime.since(other)
      ActiveSupport.deprecator.warn(
        "Adding an instance of #{other.class} to an instance of #{self.class} is deprecated. This behavior will raise " \
        "a `TypeError` in Rails 8.1."
      )
      result.in_time_zone(time_zone)
    end
    result.in_time_zone(time_zone)
  end
end
alias_method :since, :+
alias_method :in, :+
```

`packages/activesupport/src/time-with-zone.ts:529-570` reaches the same results
through a positive type dispatch instead. Surfaced while porting
`test_plus_two_time_instances_raises_deprecation_warning` in #7582, which added
the deprecating arm; the surrounding shape is older. Four separable divergences:

1. **The variable-duration guard is inlined.** The body tests
   `interval instanceof Duration && interval.isVariable()` even though the port
   already carries the Rails helper — `durationOfVariableLength`, private, at
   `time-with-zone.ts:883-885` — which nothing calls. Rails extracts it
   (`time_with_zone.rb:589-591`), so the port should call it.
2. **`method_missing(:+, other)` is replaced by a direct `advance` call** with a
   hand-expanded parts object (`years`/`months`/`weeks`/`days`/`hours`/
   `minutes`/`seconds`, each `|| undefined`). Rails routes through
   `method_missing`, which is ported (`time-with-zone.ts:158`), so the
   indirection Rails relies on exists.
3. **`utc + other` and its `rescue TypeError` are absent.** The port never
   computes `utc + other`; the number branch does inline epoch-millisecond
   arithmetic and the time-like branch is entered by a positive
   `Object.actsLike(interval, "time")` test. A consequence is that
   `in_time_zone(time_zone)` is called once rather than Rails' twice — reviewed
   on #7582 and confirmed non-functional (`inTimeZone` is pure), so it is the
   `begin/rescue` shape that is the divergence, not the call count.
4. **`since` and `in` are separate methods, not aliases.**
   `time-with-zone.ts:592-602` defines each as `plus(other: number)`, narrowing
   the parameter to `number`, where Rails aliases them to `+` — so
   `twz.since(10.days)` and `twz.in(1.hour)` do not accept what `+` accepts.

## Converged shape

`plus` mirrors the Ruby body: `durationOfVariableLength(interval)` guarding a
`methodMissing("plus", interval)` arm, and an `else` whose `try` computes
`this.utc().plus(interval)` with a `catch` narrowed to `TypeError` carrying the
deprecation and the `datetimeSince` fallback. `since` and `in` become aliases of
`plus` rather than number-narrowed wrappers.

`Time#+` must raise `TypeError` for a time-like operand for the `catch` to be
reachable — verify that against `RubyTime#plus` before restructuring, and keep
the positive dispatch only for what genuinely cannot raise.

## Acceptance criteria

- `plus` calls `durationOfVariableLength`, and the helper is no longer
  uncalled.
- The variable-duration arm goes through `methodMissing`, not a hand-expanded
  `advance` parts object.
- The deprecating arm is reached by a `catch (TypeError)` around
  `this.utc().plus(interval)`, matching `time_with_zone.rb:302-311`.
- `since` and `in` accept everything `plus` accepts.
- `core_ext/time_with_zone_test.rb`'s `plus`/`minus`/`since` cases stay green,
  and `pnpm parity:api:calls` does not gain a row.
