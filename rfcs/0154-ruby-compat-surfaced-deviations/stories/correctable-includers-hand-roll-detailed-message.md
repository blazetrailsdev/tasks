---
title: "Association errors and Thor hand-roll what DidYouMean::Correctable now provides"
status: draft
updated: 2026-10-07
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8619 ported `DidYouMean::Correctable#original_message` and
`#detailed_message` as a `Module`
(`packages/did-you-mean/src/core-ext/name-error.ts`,
`vendor/ruby/v3.3.11/lib/did_you_mean/core_ext/name_error.rb:5-25`) and included
it into `ActionController::ParameterMissing`. The other Rails and Thor includers
still carry stand-ins:

- `AssociationNotFoundError`, `InverseOfAssociationNotFoundError` and
  `HasManyThroughAssociationNotFoundError`
  (`packages/activerecord/src/associations/errors.ts:36,107,178`) each write
  `detailedMessage(): string { return this.message + formatter().messageFor(this.corrections) }`.
  Rails has `include DidYouMean::Correctable`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/errors.rb:17-18,46-47,87-88`)
  and defines only `corrections`. The hand-written method takes no `highlight:` /
  `did_you_mean:` and does not append the class name `super` appends.
- Thor's local `Correctable` (`packages/trailties/src/thor/error.ts:9-20`)
  overrides `toString` and takes `super_` as a parameter;
  `vendor/thor/v1.3.2/lib/thor/error.rb` uses `DidYouMean::Correctable` when it
  is defined.
- `corrections` has two spellings: a getter on `ParameterMissing` and the three
  association errors, a method on Thor's errors. The ported
  `Correctable#detailedMessage` reads `this.corrections` as a property;
  `ExceptionWrapper#corrections`
  (`packages/actionpack/src/action-dispatch/middleware/exception-wrapper.ts:198`)
  reads it as a property too. Ruby calls a method (`name_error.rb:17`).

`port-did-you-mean-correctable-onto-name-error` owns `Correctable#corrections`,
`#spell_checker` and the `correct_error` registry; this story is the includers.

## Acceptance criteria

- The three association errors and Thor's errors `include(…, Correctable)` from
  `@blazetrails/did-you-mean` and drop their own `detailedMessage` / `toString`.
- Thor's local `Correctable` is deleted.
- `corrections` has one spelling across every includer, `Correctable` and
  `ExceptionWrapper#corrections`.
