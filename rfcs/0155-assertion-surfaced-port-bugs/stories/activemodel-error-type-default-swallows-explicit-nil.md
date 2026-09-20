---
title: "activemodel-error-type-default-swallows-explicit-nil"
status: draft
updated: 2026-09-20
rfc: "0155-assertion-surfaced-port-bugs"
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

Surfaced converging `errors_test.rb`'s assertions (RFC 0132,
`assertions-activemodel-errors-cluster`).

Ruby's `Error#initialize` (`vendor/rails/activemodel/lib/active_model/error.rb:102-108`)
is `def initialize(base, attribute, type = :invalid, **options)`, and a Ruby
default fills in only an OMITTED argument. An explicitly-passed `nil` reaches
the body, so `@raw_type = nil` while `@type = type || :invalid` is `:invalid`,
and `details` — which reads `raw_type` (`error.rb:143-148`) — answers
`{ error: nil }`.

trails' constructor (`packages/activemodel/src/error.ts:185-197`) spells the
same default as a TypeScript default parameter, `type: string = ":invalid"`,
which swallows an explicitly-passed `undefined` AND has no way to accept `null`
(the parameter type is `string | (…) => string`). So
`errors.add("baz", null)` stores `rawType = ":invalid"` and `details` answers
`{ error: ":invalid" }` where Rails answers `{ error: null }`. This is the
kwarg trap CLAUDE.md names under "Ruby idioms that do not translate literally".

Parked `it.skip` with
`BLOCKED: activemodel-error-type-default-swallows-explicit-nil` in
`packages/activemodel/src/errors.test.ts`:

- `details retains original type as error` (`errors_test.rb:566-582`) —
  `errors.add(:baz, nil)` then `assert_equal … baz: [{ error: nil }] …`.

The body is converged to Rails' single `assert_equal` and passes `null` through
a cast so the file typechecks. The other three attributes in the same assertion
already match.

`Errors#normalizeArguments` and `Errors#add` sit on the same path and need the
same treatment — a caller that omits `type` must still get `:invalid`, while one
that passes `nil` must not.

## Acceptance criteria

- `new Error(base, attr, null)` leaves `rawType` null and `type` `":invalid"`,
  matching `error.rb:105-106`, and `Errors#add` forwards an explicit `nil`.
- `details retains original type as error` is un-skipped, the cast removed, and
  it passes.
