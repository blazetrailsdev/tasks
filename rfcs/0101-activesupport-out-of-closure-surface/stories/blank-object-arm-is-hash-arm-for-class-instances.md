---
title: "blank?'s fallthrough arm is the Hash arm, applied to every object"
status: done
updated: 2026-08-14
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 110
priority: null
pr: 6512
claim: "2026-08-14T11:46:26Z"
assignee: "drop-builder-association-scope-option-shim"
blocked-by: null
closed-reason: null
---

# `blank?`'s fallthrough arm is the Hash arm, applied to every object

## Context

`vendor/rails/activesupport/lib/active_support/core_ext/object/blank.rb:18-20`
is:

```ruby
def blank?
  respond_to?(:empty?) ? !!empty? : !self
end
```

For any object that does **not** respond to `empty?`, `blank?` is `!self` —
i.e. **always `false`**, because only `nil`/`false` are falsy in Ruby. Ruby's
`Hash#blank?` is a separate reopening (`alias_method :blank?, :empty?`,
blank.rb:111).

`packages/activesupport/src/core-ext/object/blank.ts` collapses those two into
one final arm:

```ts
if (typeof value === "object") return Object.keys(value).length === 0;
```

That is the **Hash** arm (blank.rb:111) standing in for the **Object** arm
(blank.rb:18-20). A JS object literal is trails' Ruby Hash, so own-key
emptiness is right for it — but the same line also catches every _class
instance_, and Ruby's answer for those is an unconditional `false`. Any class
that keeps its state in internal slots, private fields, or prototype getters
has zero own keys and is therefore reported **blank** — the exact inversion of
blank.rb:18-20.

PR #6508 fixed one family of this (`Temporal.*` and `TimeWithZone`, which
`Object.keys` reports as `0`) by widening the `Time` arm. That was the right
fix for Time — blank.rb:182-184 really does reopen `Time` — but it treats one
symptom. Every other getter-only or slot-only class in the monorepo still falls
through to the Hash arm and answers backwards, and each will keep arriving as
its own bug report.

Verified: `Object.keys(new (class { get a() { return 1 } })()).length === 0`.

## Converged shape

Split the one arm back into blank.rb's two:

- A **plain object** — `Object.getPrototypeOf(value)` is `Object.prototype` or
  `null` — is the Ruby `Hash`, and keeps `Object.keys(value).length === 0`
  (blank.rb:111). Verified: this is `true` for `{}` and `false` for a class
  instance.
- Anything else reaches `Object#blank?` (blank.rb:18-20): the existing
  `isEmpty`/`empty` probe already above it answers the `respond_to?(:empty?)`
  branch, and the `else` is `!self` — a bare `false`, never an own-key count.

With that in place the `Time` arm's Temporal widening from #6508 becomes
belt-and-braces rather than the thing holding the answer up, and no future
slot-only class needs its own arm.

Check the fallout before landing: some callers may be leaning on the current
(wrong) "class instance with no own keys is blank" answer.

## Acceptance criteria

- [ ] `isBlank(instanceOfSomeClassWithNoOwnKeys)` is `false`, per blank.rb:18-20.
- [ ] `isBlank({})` stays `true` and `isBlank({ a: 1 })` stays `false`
      (blank.rb:111).
- [ ] The `isEmpty`/`empty` probe still answers first, for both the boolean and
      the method-shaped spellings already ported.
- [ ] `blank.test.ts` covers a getter-only class instance alongside the plain
      object cases.
- [ ] `pnpm parity:api:calls` / `:args` / `parity:api:extra` green.
