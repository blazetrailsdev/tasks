---
title: "validates_with registers an arrow wrapper where Rails registers the validator object"
status: ready
updated: 2026-09-05
rfc: "0134-activemodel-surfaced-deviations"
cluster: null
packages: []
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

Surfaced by `validate-set-callback-narrows-options-and-wraps-filters` (PR #7514),
which made this convergeable for the first time.

Rails' `validates_with` registers the validator OBJECT as the callback filter:

```ruby
validate validator, options
```

`vendor/rails/activemodel/lib/active_model/validations/with.rb:103`

The filter is then an `ObjectCall` (`activesupport/lib/active_support/callbacks.rb:494-511`),
dispatched through the chain's `current_scopes` — which is how a validator
participates in `skip_callback`, `_validators` bookkeeping and callback
deduplication by reference.

trails wraps it in an arrow instead
(`packages/activemodel/src/validations/with.ts:80`):

```ts
this.validate((record) => validator.validate(record), options);
```

The wrapper is an `InstanceExec1`, not an `ObjectCall`, so the registered filter
is a fresh anonymous function rather than the validator — `skipCallback` by
validator reference cannot find it, and `Callback#duplicates?` never matches.

Until PR #7514 this could not converge: `isCallbackOptions` refused a hash
carrying a function value, and `validates_with` puts `options[:class] = self`
(with.rb:88-104) into the forwarded hash, so passing the validator plus that
hash misparsed. #7514 made `set_callback`'s trailing-hash detection match
Ruby's `args.extract_options!`, so the Rails shape now works.

Note the chain scope: `validate` is defined with `scope: ["name"]`
(`packages/activemodel/src/validations.ts:75`, mirroring
`activemodel/lib/active_model/validations.rb:59`'s
`define_callbacks :validate, scope: :name`), so `ObjectCall` dispatches to the
object's `validate` method — which every `Validator` answers.

## Acceptance criteria

- [ ] `validatesWith` passes the validator itself as the filter, mirroring
      with.rb:103 — no arrow wrapper.
- [ ] A validator registered through `validatesWith` is removable with
      `skipCallback("validate", "before", validator)`.
- [ ] Existing `with-validation.test.ts` stays green; parity:api / parity:test
      delta non-negative; no new call-argument baseline row.
