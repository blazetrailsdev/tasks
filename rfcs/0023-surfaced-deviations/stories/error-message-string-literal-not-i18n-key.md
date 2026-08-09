---
title: "Error#message keeps a String message literal instead of promoting it to an i18n key"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already done: IDENTIFIER_RE is gone from packages/activemodel/src/error.ts and from the whole packages/ tree, so String messages no longer get promoted to i18n keys."
---

## Context

Surfaced while landing `am-ar-i18n-register-en-on-load-path` (#6084).

Rails' `I18nValidationTest` setup clears the load path for the WHOLE file
(`activemodel/test/cases/validations/i18n_validation_test.rb:11-17`):

```ruby
@old_load_path, @old_backend = I18n.load_path.dup, I18n.backend
I18n.load_path.clear
I18n.backend = I18n::Backend::Simple.new
I18n.backend.store_translations("en", errors: { messages: { custom: nil } })
```

`packages/activemodel/src/validations/i18n-validation.test.ts` cannot: with the
load path cleared, ~24 of its cases go translation-missing, because they assert
messages that live in `activemodel/locale/en.yml` (`"Name can't be blank"`)
where Rails asserts a literal string it passed in (`@person.errors.add(:name,
"not found")` :39, `add("name", "empty")` :47). The cause is the trails
deviation documented in that file: `Error#message` promotes identifier-shaped
Strings to a type through `error.ts`'s `IDENTIFIER_RE`, so `add(attr, "empty")`
resolves `errors.messages.empty` instead of staying a literal message
(Rails: `active_model/error.rb` — a String message is used verbatim, only a
Symbol is looked up).

PR #6084 therefore clears the load path in the single colliding case
(`errors full messages uses format`) rather than file-wide.

## Acceptance criteria

- `Error#message` treats a String message as a literal, per Rails: only the
  `":symbol"` form (the trails Symbol spelling) resolves through I18n. The
  `IDENTIFIER_RE` promotion in `packages/activemodel/src/error.ts` is gone.
- `i18n-validation.test.ts` ports Rails' file-wide setup/teardown verbatim
  (clear + restore the load path and the backend, store
  `errors: { messages: { custom: nil } }`), and its cases assert Rails' literal
  messages, with the local clear in `errors full messages uses format` and the
  `IDENTIFIER_RE` comments deleted.
- No baseline row, `@noRailsEquivalent` tag or skip added.
