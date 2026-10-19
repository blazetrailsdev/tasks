---
title: "did-you-mean-top-level-spell-checkers-registry"
status: done
updated: 2026-10-19
rfc: "0193-small-gem-ports-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9066
claim: "2026-10-19T14:18:14Z"
assignee: "did-you-mean-top-level-spell-checkers-registry"
blocked-by: null
closed-reason: null
---

## Context

`vendor/sources.ts` now extracts `lib/did_you_mean.rb` (`libEntryFile`), which
`packages/did-you-mean/src/did-you-mean.ts` mirrors. `formatter` /
`formatter=` (`vendor/did_you_mean/v1.6.3/lib/did_you_mean.rb:141-155`) are
ported there. Three of the file's methods are not, so `pnpm parity:api
--package did-you-mean --missing` reports did_you_mean.rb at 2/5:

- `DidYouMean.spell_checkers` (`did_you_mean.rb:92-94`): the `@spell_checkers`
  map, `Hash.new(NullChecker)`, keyed by error class name.
- `DidYouMean.correct_error(error_class, spell_checker)` (`did_you_mean.rb:97-108`):
  records the checker and prepends `Correctable` to the error class. The
  module body calls it for NameError, KeyError, NoMethodError, LoadError and
  NoMatchingPatternKeyError (`:110-114`). trails' `Correctable`
  (`packages/did-you-mean/src/core-ext/name-error.ts`) is applied per class by
  its consumers (actionpack `exceptions.ts`, `strong-parameters.ts`) instead.
- `DeprecatedMapping#merge!` (`did_you_mean.rb:124-131`), behind the deprecated
  `SPELL_CHECKERS` constant.

## Acceptance criteria

- [ ] `spellCheckers` and `correctError` are ported in `did-you-mean.ts` at their
      Rails names, and `Correctable`'s consumers go through `correctError` where
      Rails' do.
- [ ] `DeprecatedMapping` is ported or its skip is recorded in `SKIP_GROUPS`
      with Rails' "TODO: Remove on 3.3" as the reason.
- [ ] did_you_mean.rb has no missing rows in `pnpm parity:api --package did-you-mean --missing`.
