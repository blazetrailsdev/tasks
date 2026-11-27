---
title: "port-did-you-mean-variable-name-checker"
status: draft
updated: 2026-11-27
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

`NameErrorCheckers` (`packages/did-you-mean/lib/spell-checkers/name-error-checkers.ts`)
ports `vendor/did_you_mean/v1.6.3/lib/did_you_mean/spell_checkers/name_error_checkers.rb`,
but its undefined-local/method/class-variable/struct-member arm answers
`NullChecker` where Ruby answers `VariableNameChecker`
(`spell_checkers/name_error_checkers/variable_name_checker.rb`), receipted
`@missingRailsCall VariableNameChecker — CONVERGEABLE port-did-you-mean-variable-name-checker`.
`VariableNameChecker` reads `exception.local_variables`, `receiver.methods`,
`private_methods`, `instance_variables`, `class_variables`; trails can answer
`methods` via `rbObjMethods`; locals have no JS source.

## Acceptance criteria

- `VariableNameChecker` ported at its Rails path, with whatever dictionary
  sources trails can answer (methods / ivars), locals decided and stated.
- `NameErrorCheckers` arm returns it; the `@missingRailsCall` receipt removed.
- Its unported-files row in `scripts/parity/unported-files/did-you-mean.ts` removed;
  `test_variable_name_check.rb` ported where portable.
