---
title: "validates-does-not-route-through-parse-validates-options"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
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
closed-reason: "merged into converge-model-validates-onto-rails-generic-lookup — routing every rule value through _parse_validates_options (validates.rb:107-115) IS the generic-lookup rewrite that story specifies"
---

## Context

`ActiveModel::Validations::ClassMethods#validates`
(`vendor/rails/activemodel/lib/active_model/validations/validates.rb:107-115`)
normalizes every rule value through one helper:

```ruby
defaults = ...
validations.each do |key, options|
  ...
  validator.new(defaults.merge(_parse_validates_options(options)), &block)
```

so `length: 6..20`, `inclusion: %w(m f)` and `presence: true` all reach their
validator as the option hash `_parse_validates_options` produces
(`validates.rb:166-177`: `TrueClass -> {}`, `Hash -> itself`,
`Range, Array -> { in: options }`, else `{ with: options }`).

trails' `Model.validates` (`packages/activemodel/src/model.ts:540-650`) never
calls `_parseValidatesOptions`. It is a hand-rolled dispatcher with one `if`
per known validator key, each re-implementing only the `true -> {}` arm
inline (`model.ts:573-645`, e.g. `rules.presence === true ? {} : rules.presence`)
and spreading the value otherwise. The ported helper exists and is correct
(`packages/activemodel/src/validations.ts:_parseValidatesOptions`, exposed as
`Model._parseValidatesOptions` at `model.ts:1611`) — it is simply not on the
path.

Consequences:

- The `Range, Array -> { in: ... }` arm is unreachable through `validates`.
  Rails' `test_validates_with_range`
  (`vendor/rails/activemodel/test/cases/validations/validates_test.rb:114-121`,
  `Person.validates :karma, length: 6..20`) cannot be ported as written; the
  trails test of that name
  (`packages/activemodel/src/validations/validates.test.ts` "validates with
  range") currently asserts an unrelated `numericality` shape instead.
  Likewise `validates_test.rb:106` (`inclusion: %w(m f)`) is ported as
  `{ inclusion: { in: [...] } }` rather than the bare array Rails passes.
- The `else -> { with: options }` arm is unreachable, so
  `validates :name, format: /\A[a-z]+\z/` (a bare Regexp) does not work.
- Every new validator key needs another `if` block in `validates` rather than
  registering by name, which is why the dispatcher only knows a fixed list.

Surfaced in PR #6219 review while converging `_parseValidatesOptions`'s Range
arm (`Range` became a real class in that PR, so the `instanceof Range` test the
helper needed is now available — the helper is fixed and unit-covered in
`validates.trails.test.ts`, but nothing reaches it through `validates`).

## Acceptance criteria

- [ ] `Model.validates` resolves each rule value through
      `_parseValidatesOptions`, as `validates.rb:113` does, instead of the
      per-key `=== true ? {} : value` inline normalization.
- [ ] `validates :karma, length: <Range>` and `validates :gender, inclusion:
<Array>` reach their validators as `{ in: ... }`.
- [ ] The ported `validates with range` test is converged to
      `validates_test.rb:114-121` (`length: 6..20`, asserting the
      "is too short (minimum is 6 characters)" error), and `validates with
array` to `validates_test.rb:104-112`. Test names unchanged.
- [ ] `pnpm parity:api:calls` clean — the `validates` call-set gains
      `_parse_validates_options`.
