---
title: "date-civil-does-not-reject-extra-arguments"
status: in-progress
updated: 2026-09-24
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trails#8058
claim: "2026-09-24T21:02:32Z"
assignee: "inline-bound-value-and-join-plan-helpers"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `assertions-activesupport-cache-xml-json-callbacks` (RFC 0132).
Parked tests in `packages/activesupport/src/xml-mini.test.ts` (`ParsingTest`):
`symbol`, `integer`, `float`, `decimal`, `string`.

Each Rails test (`vendor/rails/activesupport/test/xml_mini_test.rb:253-336`)
ends with `assert_raises(ArgumentError) { parser.call(Date.new(2013, 11, 12, 02, 11)) }`.
The `ArgumentError` comes from `Date.new` itself, not the parser: Ruby's
`date_initialize` (`vendor/ruby/ext/date/date_core.c`, the `Date.new` /
`Date.civil` body) runs `rb_scan_args(argc, argv, "04", ...)`, which raises
`ArgumentError (wrong number of arguments (given 5, expected 0..4))`.

trails' `Date.civil` (`packages/date/src/date.ts`, `static civil(year, month,
mday, start)`) has four defaulted parameters and no arity check, so a fifth
argument is a TS compile error (`@ts-expect-error` in the parked bodies) and at
runtime is silently dropped — `civil(2013, 11, 12, 2, 11)` returns a date with
`start = 2` instead of raising. Every other assertion in the five tests passes.

## Acceptance criteria

- `Date.civil` (and `Date`'s constructor path) raises `ArgumentError` with
  Ruby's `rb_scan_args` message when given more than four arguments.
- Un-skip the five `ParsingTest` tests; they pass unchanged.
