---
title: "Person::Gender ports flat, losing the qualified name Translation keys off"
status: draft
updated: 2026-09-03
rfc: "0134-activemodel-surfaced-deviations"
cluster: test-placement
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

`vendor/rails/activemodel/test/models/person.rb:18-20` declares a class nested in
`Person`'s namespace:

```ruby
class Person::Gender
  extend ActiveModel::Translation
end
```

Its qualified constant name is load-bearing, because `ActiveModel::Translation`
and `ActiveModel::Naming` key off it. Rails' own tests assert exactly that:

- `vendor/rails/activemodel/test/cases/translation_test.rb:65` —
  `assert_equal "person gender attribute", Person::Gender.human_attribute_name("attribute")`
- `vendor/rails/activemodel/test/cases/translation_test.rb:94` —
  `assert_equal "gender model", Person::Gender.model_name.human`

Both derive their i18n key from the `"Person::Gender"` -> `"person/gender"`
underscore of the class name.

PR #7419 ported `person.rb` into
`packages/activemodel/src/test-helpers/models/person.ts` and emitted the class
flat, as a top-level `export class Gender`. Nothing exercises it yet, so the
flattening is invisible today — but `Gender.name` is `"Gender"`, not
`"Person::Gender"`, so the two `translation_test.rb` assertions above cannot pass
against the model as it stands.

## Converged shape

Give the class the qualified Ruby constant name that `ModelName` reads, so the
derived i18n scope is `person/gender`. `packages/activemodel/src/naming.ts`'s
`ModelName` is the consumer to check against — settle whether the answer is a
`name` the class declares, a `modelName` override, or nesting the constant on
`Person`, and mirror whatever spelling the repo already uses for a Ruby nested
constant elsewhere (there was no precedent in `activemodel` at the time of
filing).

Do this together with the `translation_test.rb` port, so the fix lands with the
assertions that prove it.

## Acceptance criteria

- `Person::Gender`'s trails counterpart resolves the same model name / i18n scope
  Ruby derives from the qualified constant (`person/gender`).
- `translation_test.rb:65` and `:94` port and pass against it.
- No test names change; `pnpm parity:test` percent for activemodel does not drop.
