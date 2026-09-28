---
title: "port-did-you-mean-correctable-onto-name-error"
status: draft
updated: 2026-09-28
rfc: "0154-ruby-compat-surfaced-deviations"
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
closed-reason: null
---

## Context

`helper-name-error-has-no-did-you-mean` (0141) needs `NameError#detailed_message`
to carry a did-you-mean suggestion, as Rails' `test_helper_typo_error_message`
asserts (`vendor/rails/v8.0.2/actionpack/test/controller/helper_test.rb:87-93`).
trails' `NameError` (`packages/ruby-compat/src/name-error.ts`) has no
`detailedMessage` at all, and the did_you_mean machinery that supplies it in
Ruby is registered as unported:

- `scripts/parity/unported-files/did-you-mean.ts` lists `core_ext/name_error.rb`
  and `/formatter.rb` with the reason "JS has no NameError". That reason is
  stale: ruby-compat now defines `NameError` (with `constantName` and
  `receiver()`).
- Ruby wires it in `vendor/did_you_mean/v1.6.3/lib/did_you_mean.rb:110`
  (`correct_error NameError, NameErrorCheckers`), which prepends
  `DidYouMean::Correctable` (`core_ext/name_error.rb`: `detailed_message`,
  `corrections`, `spell_checker`) onto `NameError`.
- `NameErrorCheckers.new` (`spell_checkers/name_error_checkers.rb`) picks
  `ClassNameChecker` for `/uninitialized constant/`, `VariableNameChecker`
  for the undefined-local/method messages, and `NullChecker` otherwise.
- `ClassNameChecker` (`spell_checkers/name_error_checkers/class_name_checker.rb`)
  builds its dictionary from `receiver`'s lexical `scopes` and each scope's
  `constants`. trails has no Module#constants analogue, so this is the design
  decision the story has to settle (e.g. a receiver namespace object whose own
  capitalised keys are its constants, as `activesupport/src/namespaces.ts`
  namespaces already are).
- `Formatter.message_for` (`formatter.rb:32-34`) renders
  `"\nDid you mean?  a\n               b"`.
  `packages/activerecord/src/associations/errors.ts` hand-rolls the same string
  as a private `withCorrections`, which should converge onto the port.

`@blazetrails/did-you-mean` currently has no dependencies, so the port either
adds a workspace dep on `@blazetrails/ruby-compat` (did_you_mean patches
NameError, as Ruby's gem does) or lives in ruby-compat.

## Acceptance criteria

- `Formatter.messageFor` ported at `formatter.rb`'s path in did-you-mean.
- `NameError` answers `detailedMessage({ highlight, didYouMean })` and
  `corrections` per `core_ext/name_error.rb`, wired through a
  `correctError(NameError, NameErrorCheckers)` registration mirroring
  `did_you_mean.rb:97-110`.
- `ClassNameChecker` ported, with its `scopes` / `classNames` dictionary source
  decided and stated.
- The two unported-files entries are removed.
- `helper-name-error-has-no-did-you-mean` can then feed the helper constant
  table as the receiver scope at `abstract-controller/helpers.ts`'s raise site.
