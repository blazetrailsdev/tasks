---
title: "activemodel: Type::String#cast_value's ::String.new(value) has no JS carrier and no ratifying section"
status: draft
updated: 2026-10-01
rfc: "0173-activemodel-parity-100"
cluster: null
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveModel::Type::String#cast_value`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/type/string.rb:33-40`) copies
a String it is handed:

```ruby
case value
when ::String then ::String.new(value)
```

so the attribute's value is a fresh, unfrozen String the caller's later
mutations cannot reach. `ImmutableString#cast_value`
(`type/immutable_string.rb:62-68`) is the frozen twin (`value.to_s.freeze`).

`packages/activemodel/src/type/string.ts:25-30` ports the arm as
`if (typeof value === "string") return String(value)` and receipts the omitted
call: `@missingRailsCall new — CONVERGEABLE type-string-cast-value-string-new-has-no-js-carrier`.

A JS string is an immutable primitive, so `String(value)` IS `value` and there
is no copy to make — that part is a language fact. But no CLAUDE.md section
records it, so the receipt could not stay PERMANENT under
`activemodel-audit-permanent-receipts-subdirs`'s rule. The same fact sits behind
`type/string.test.ts`'s two skipped mutation tests and
`changed-in-place-for-immutable-scalars-needs-attribute-surgery`.

## Acceptance criteria

- [ ] Decide the one repo-wide answer for `String.new(str)` / `str.dup` /
      `str.freeze` on a Ruby String ported as a JS string: either the call gate
      credits the identity spelling (a `NO_JS_CALL_FORM`-style entry with a
      test in `scripts/api-compare/`), or a carrier exists and the call is made.
- [ ] `StringType#castValue` carries no `@missingRailsCall new` receipt.
- [ ] `pnpm parity:api:calls` green with no baseline row added.

## Verification

```bash
pnpm parity:api:calls && pnpm parity:api:receipts:gate && pnpm vitest run packages/activemodel/src/type/string.test.ts
```
