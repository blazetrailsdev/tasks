---
title: "SpellChecker dictionary takes an Enumerable; ActionNotFound passes the action_methods Set"
status: draft
updated: 2026-11-06
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`DidYouMean::SpellChecker#correct` reads `@dictionary.select` (did_you_mean `spell_checker.rb`), so any Enumerable works as the dictionary. `AbstractController::ActionNotFound#corrections` passes `controller.class.action_methods`, a `Set`, directly (`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/base.rb:26`).

trails' `packages/did-you-mean/src/spell-checker.ts:5,21` types `dictionary` as `ReadonlyArray<string>`. Since trails#9758 `actionMethods()` returns a `ReadonlySet`, so `packages/actionpack/src/abstract-controller/base.ts` `corrections` spreads it into an array (`dictionary: [...ctor.actionMethods()]`), a conversion Rails does not make.

## Acceptance criteria

- `SpellChecker` takes `Iterable<string>` (Ruby Enumerable) and iterates it where Ruby calls `select`.
- `ActionNotFound#corrections` passes `ctor.actionMethods()` with no spread.
