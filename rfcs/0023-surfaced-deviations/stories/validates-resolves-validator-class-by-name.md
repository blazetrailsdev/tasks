---
title: "Model.validates resolves validator classes by name, not an if-chain"
status: closed
updated: 2026-08-17
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: 'Duplicate of 0023-surfaced-deviations/converge-model-validates-onto-rails-generic-lookup (filed from PR #6625, draft, est-loc 400), which covers the same convergence: replacing Model.validates'' hardcoded if-chain with Rails'' generic const_get("#{key.camelize}Validator") lookup at validates.rb:105-133. That story is the one to work; nothing in mine is additive beyond the ''Unknown validator'' ArgumentError and custom-validator reachability, both implied by the generic lookup.'
---

## Context

`Model.validates` (`packages/activemodel/src/model.ts`) dispatches to validator
classes with a hand-rolled if-chain, one `if (rules.<key>)` block per known
validator:

```ts
if (rules.presence) { … validatorSpecs.push({ klass: PresenceValidator, opts }); }
if (rules.absence)  { … validatorSpecs.push({ klass: AbsenceValidator, opts }); }
if (rules.length)   { … }
// … ten more
```

Rails does not enumerate validators. `validates` resolves each validator key to
a class **by name**, at call time
(`vendor/rails/activemodel/lib/active_model/validations/validates.rb:119-131`):

```ruby
validations.each do |key, options|
  key = "#{key.to_s.camelize}Validator"

  begin
    validator = const_get(key)
  rescue NameError
    raise ArgumentError, "Unknown validator: '#{key}'"
  end

  next unless options

  validates_with(validator, defaults.merge(_parse_validates_options(options)))
end
```

Three consequences of the divergence:

1. **A custom validator class cannot be reached by key.** Rails resolves
   `const_get` against the model's own namespace, so
   `validates :title, my_custom: true` finds a `MyCustomValidator` defined on or
   near the model. trails silently ignores any key not in its if-chain.
2. **No `ArgumentError, "Unknown validator: '<Name>Validator'"`.** A typo'd
   validator key (`presance: true`) is silently dropped instead of raising.
   Rails' `validates_test.rb` covers this
   (`test_validates_with_unknown_validator`).
3. **Every new validator needs a new `if` arm in `model.ts`**, so the file grows
   with the validator set instead of staying fixed.

The blocker is that TypeScript has no `const_get`: there is no way to look a
class up from a runtime string without a registry. The settled shape is
presumably a name→class map registered by each `validations/*.ts` module (the
same self-registration pattern the type registry already uses), consulted by
`validates` with the `ArgumentError` as the miss path — but the exact mechanism
should be chosen deliberately, not assumed by this story's author.

Surfaced while porting `validations_test.rb`
(`assertions-activemodel-validations-test-part2`, PR #6647), which made
`validates` variadic and added both of Rails' `ArgumentError` guards but left
the dispatch loop alone as out of scope. The if-chain is inherited debt, not a
decision — filed so it is not propagated further.

## Acceptance criteria

- `Model.validates` resolves each validator key to its class by name, mirroring
  `validates.rb:119-131`, rather than by an if-chain over known keys. Adding a
  validator no longer requires editing `validates`.
- An unresolvable key raises `ArgumentError` with Rails' message,
  `"Unknown validator: '<CamelCased>Validator'"`.
- A validator key whose value is falsy is still skipped (`next unless options`)
  and still satisfies the "You need to supply at least one validation" guard —
  `test_validates_with_false_hash_value` in `validations_test.rb` must stay green.
- A user-defined validator class is reachable by its underscored key, matching
  Rails' `const_get` lookup as closely as a registry allows; the lookup mechanism
  is documented at the call site.
- `pnpm parity:test -- --assertions --package activemodel` does not regress; the
  `validations/validates_test.rb` row improves.
- `pnpm parity:api:extra --package activemodel` gains no untagged surface.
