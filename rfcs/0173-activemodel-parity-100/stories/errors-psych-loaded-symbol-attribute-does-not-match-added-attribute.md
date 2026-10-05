---
title: "activemodel: a Psych-loaded Errors has unset ivars and a ':name' attribute that does not match add('name')"
status: done
updated: 2026-10-04
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8504
claim: "2026-10-04T22:27:18Z"
assignee: "define-method-attribute-raises-through-missing-attribute"
blocked-by: null
closed-reason: null
---

## Context

Surfaced claiming `activemodel-port-marshal-and-yaml-error-tests` (RFC 0173), porting
`test "errors are compatible with YAML dumped from Rails 6.x"`
(`vendor/rails/v8.0.2/activemodel/test/cases/errors_test.rb:680-703`) over
`Psych.unsafeLoad` (`packages/ruby-compat/src/psych.ts`). Two gaps stop Rails' body passing.

**1. `Errors`' ivars are not declared.** `ToRuby#initWith`
(`packages/ruby-compat/src/psych/visitors/to-ruby.ts`) sets `@base` / `@errors` through
`rbObjIvarSet`, which maps an undeclared ivar to the camelCased field, so it defines own
`errors` / `base` properties on the revived object. `Errors` keeps them in `_errors` / `_base`
(`packages/activemodel/src/errors.ts:42-43`), which stay unset, and `messages` then throws
`TypeError: ary is not iterable` from `groupByAttribute`. Verified fix, the idiom
`attribute-set.ts:158` uses: `rbDeclareIvar(Errors, "@errors", "_errors")` and
`rbDeclareIvar(Errors, "@base", "_base")` beside `rbModConstSet(ActiveModel, "Errors", Errors)`.
The test's `Person` also needs `registerConstant("ErrorsTest::Person", Person)` in
`errors.test.ts` so `!ruby/object:ErrorsTest::Person` resolves. With both, the load succeeds
and the message is generated (`"is invalid"`).

**2. A Psych-loaded Symbol attribute is spelled `":name"`, an added one `"name"`.** Rails'
`normalize_arguments` returns `attribute.to_sym`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/errors.rb:490-497`) and the YAML carries
`attribute: :name`, so in Ruby both are the Symbol `:name` and
`assert_equal({ name: ["is invalid"] }, errors.messages)` holds. In trails `Errors#add` keeps
the attribute bare (`errors.add("name", ":invalid")` stores `"name"`, `errors.ts:181-203`),
while Psych's `ToRuby` answers the YAML scalar `:name` as the string `":name"`. With gap 1
fixed the test fails only on this:

```text
expected Map{ ':name' => [ 'is invalid' ] } to deeply equal { name: [ 'is invalid' ] }
```

So a loaded `Errors` does not answer `where("name")` / `messagesFor("name")` for the error it
holds. `ActiveModel::Error` has no `init_with`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/error.rb:103-109`), so there is no Rails
hook to normalize in; the spelling of `Error#attribute` (bare vs colon-prefixed) has to be
decided once for `Errors`, not patched in the test.

## Acceptance criteria

- [ ] `Errors` declares `@errors` / `@base` with `rbDeclareIvar`, and
      `Psych.unsafeLoad` of a `!ruby/object:ActiveModel::Errors` mapping revives a working
      `Errors` (regression test fails on baseline with `ary is not iterable`).
- [ ] An `Error` whose attribute arrives as a Psych-loaded Symbol is the same attribute as
      one passed to `Errors#add`: `messages`, `details`, `where`, `messagesFor` agree.
- [ ] `errors are compatible with YAML dumped from Rails 6.x` runs un-skipped in
      `packages/activemodel/src/errors.test.ts` with Rails' body and four assertions, without
      asserting a `":name"` key.

## Verification

```bash
pnpm vitest run packages/activemodel/src/errors.test.ts
```
