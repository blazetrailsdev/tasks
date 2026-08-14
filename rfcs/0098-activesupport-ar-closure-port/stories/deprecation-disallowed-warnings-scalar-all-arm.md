---
title: "deprecation-disallowed-warnings-scalar-all-arm"
status: done
updated: 2026-08-14
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6521
claim: "2026-08-14T14:27:02Z"
assignee: "deprecation-disallowed-warnings-scalar-all-arm"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the review of PR #6256 (the `Deprecators` port).

Rails' `disallowed_warnings` accepts **either** an Array of String / Symbol /
Regexp rules **or** the scalar Symbol `:all`
(`activesupport/lib/active_support/deprecation/disallowed.rb:6-23`), and
`deprecation_disallowed?` branches on the scalar first:

```ruby
return true if disallowed_warnings == :all
message && disallowed_warnings.any? { |rule| ... }
```

(`disallowed.rb:26-36`)

trails types the field array-only —
`disallowedWarnings: (string | RegExp | "all")[]` in
`packages/activesupport/src/deprecation.ts` — and `_matchesDisallowed` folds
the scalar arm into the element loop (`for (const w of ...) if (w === "all")
return true`). So Rails' `deprecator.disallowed_warnings = :all` has no trails
spelling; callers write `["all"]`, and a legitimate rule _string_ `"all"` is
indistinguishable from the scalar.

Two further divergences in the same body:

- the `Symbol` arm of the `case rule` (`disallowed.rb:31-32`) is dropped —
  trails handles `string` and `RegExp` only. Per CLAUDE.md a Ruby Symbol value
  is a colon-prefixed string, so the rule spelling is `":foo"` and
  `message.include?(rule.to_s)` compares against `"foo"`.
- Rails guards `message &&` before `.any?` (`disallowed.rb:29`); trails' `warn`
  always passes a defaulted string, so the guard has no port.

`deprecators.test.ts`'s `#disallowed_warnings= applies to each deprecator`
currently cements the array workaround (`setDisallowedWarnings(["all"])`)
because that is all the type allows; it should assert the scalar once this
lands.

## Converged shape

Widen the field to `(string | RegExp)[] | ":all"` (Ruby's `:all` Symbol,
spelled per the colon-prefixed-string convention), give `_matchesDisallowed`
Rails' branch order — `explicitly_allowed?` guard, scalar `:all` early return,
then the `any?` loop with String / Symbol / Regexp arms — and update
`deprecators.test.ts` / `deprecation.test.ts` to the Rails assertion.

## Acceptance criteria

- [ ] `disallowedWarnings` accepts the scalar `":all"` as well as the rule
      array (`disallowed.rb:6-23`).
- [ ] `_matchesDisallowed` mirrors `deprecation_disallowed?`'s branch order,
      including the `Symbol` rule arm (`disallowed.rb:26-36`).
- [ ] `deprecators.test.ts`'s `#disallowed_warnings= applies to each
deprecator` sets the scalar, as `deprecators_test.rb:66-69` does.
