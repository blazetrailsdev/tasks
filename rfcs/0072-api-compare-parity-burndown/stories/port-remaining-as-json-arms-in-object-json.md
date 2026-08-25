---
title: "Port the remaining core_ext/object/json.rb as_json arms (Enumerable, Range, Symbol, Module, Pathname, …)"
status: done
updated: 2026-08-08
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages:
  - activesupport
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 6209
claim: "2026-08-08T00:01:22Z"
assignee: "abstract-adapter-role-shard-cast-hides-ruby-nomethoderr"
blocked-by: null
closed-reason: null
---

## Context

PR #6205 ported `core_ext/object/json.rb` into
`packages/activesupport/src/core-ext/object/json.ts`, covering the arms
`JSONGemEncoder#jsonify` had inlined: `Object`, `Hash`, `Array`, `Numeric`,
`Float`, `Regexp`, `Exception`, `TrueClass`/`FalseClass`, `NilClass`, `String`,
and `Time`/`Date`/`DateTime`. Eleven reopened classes were out of that story's
"at minimum" list and are still unported:

- `Module#as_json` — `vendor/rails/activesupport/lib/active_support/core_ext/object/json.rb:52-56` (returns `name`)
- `Data#as_json` — `json.rb:68-72` (`to_h.as_json(options)`)
- `Struct#as_json` — `json.rb:74-78` (`to_h.as_json(options)`)
- `Symbol#as_json` — `json.rb:104-108` (`name`)
- `BigDecimal#as_json` — `json.rb:124-137` (`finite? ? to_s : nil` — a JSON _string_, deliberately)
- `Enumerable#as_json` — `json.rb:145-149` (`to_a.as_json(options)`)
- `IO#as_json` — `json.rb:151-155` (`to_s`)
- `Range#as_json` — `json.rb:157-161` (`to_s`)
- `URI::Generic#as_json` — `json.rb:230-234` (`to_s`)
- `Pathname#as_json` — `json.rb:236-240` (`to_s`)
- `Process::Status#as_json` — `json.rb:250-254` (`{ exitstatus:, pid: }`)

Today a value of any of these types falls through the new dispatcher's tail and
is handled by `Object.asJson` (an attribute-bag spread) or, for JS built-ins
carrying a `toJSON`, by that method — neither of which is the Rails answer. A
`Set`, for instance, should take the `Enumerable` arm and encode as an array;
it currently spreads to `{}`.

Rails' `Encoding` uses of these are real: `ActiveSupport::JSON.encode(1..5)`
emits `"1..5"`, and `encode(Set.new([1,2]))` emits `[1,2]`.

## Converged shape

One `static asJson(value, options)` per Ruby class in
`packages/activesupport/src/core-ext/object/json.ts`, in Rails' file order,
matching the shape the existing classes there already use, plus the matching
arm in the file's `asJson()` dispatcher (ordered most-specific first, as Ruby's
method lookup is). Several have no JS analogue — `Process::Status`, `IO`,
`Data`, `Struct`, `BigDecimal`, `URI::Generic` — and should be skipped rather
than faked; pick the ones with real analogues (`Symbol`, `Enumerable`/iterables,
`Range` if trails has one, `Pathname`, `Module`/constructors) and put the rest
in a `SKIP_GROUPS` entry in `scripts/api-compare/conventions.ts` with the
reason.

## Acceptance criteria

- [ ] Each ported arm is a class of the Ruby name with `static asJson`, bodied
      from the cited `json.rb` line range.
- [ ] The `asJson()` dispatcher routes to each new arm before its `Object.asJson`
      tail.
- [ ] Arms with no JS analogue are named in `SKIP_GROUPS` with a reason, not
      stubbed.
- [ ] `pnpm parity:api --package activesupport` non-negative; `pnpm parity:api:extra
--package activesupport` clean.
- [ ] `packages/activesupport/src/json/encoding.test.ts` stays green; no test
      renamed.
