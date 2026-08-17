---
title: "LengthValidator :in/:within accepts an array tuple alongside the Range object spelling"
status: draft
updated: 2026-08-17
rfc: "0082-ruby-ts-idiom-conversion-classes"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`LengthValidator`'s constructor accepts **two** spellings for `:in` / `:within`
— a `{ begin, end, excludeEnd? }` object and a bare `[min, max]` array tuple:

`packages/activemodel/src/validations/length.ts:86-103`

```ts
if (Array.isArray(range) && range.length === 2) {
  options["minimum"] = range[0];
  options["maximum"] = range[1];
} else if (... "begin" in range || "end" in range) { ... }
```

Rails takes a `Range` and nothing else —
`vendor/rails/activemodel/lib/active_model/validations/length.rb:16-20`:

```ruby
if range = (options.delete(:in) || options.delete(:within))
  raise ArgumentError, ":in and :within must be a Range" unless range.is_a?(Range)
  options[:minimum] = range.min if range.begin
  options[:maximum] = (range.exclude_end? ? range.end - 1 : range.end) if range.end
end
```

The `{ begin, end, excludeEnd }` object is the legitimate TS spelling of a Ruby
Range — it carries every field `Range` has and is what PR #6632's port of
`length_validation_test.rb` uses for all nine infinite-range cases and the
exclusive-range case. The **array tuple is the extra spelling**: it cannot
express `exclude_end?`, cannot express a beginless or endless range, and has no
Rails counterpart. It also drags `LengthRange` onto the `parity:api:extra`
novel list for this file.

Two spellings for one Ruby concept is the deviation; the tuple is the one to
drop.

## Converged shape

- Delete the `Array.isArray(range)` branch from `length.ts`'s constructor so
  `{ begin, end, excludeEnd? }` is the single Range spelling.
- Migrate the in-repo tuple callers. Known population:
  `packages/activemodel/src/validations/length-validation.trails.test.ts`
  (`in: [3, 10]`, `in: [3, 5]`) — `grep -rn "in: \[" packages/activemodel/src`
  finds the rest.
- Keep the `":in and :within must be a Range"` error (already verbatim from
  `length.rb:17`) as the rejection for anything else.

## Acceptance criteria

- `length.ts` has one Range spelling; a tuple raises the `length.rb:17`
  ArgumentError like any other non-Range.
- activemodel suite green; `pnpm parity:test` / `pnpm parity:api` deltas
  non-negative.
