---
title: "activemodel: human_attribute_name and its i18n keys for a camelCase attribute name"
status: blocked
updated: 2026-10-08
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: "Needs an owner decision the body itself lists as undecided: whether an i18n lookup key for a camelCase attribute keeps the member's spelling or takes Rails' snake_case one, and where the underscore then lives (an underscore in Error.fullMessage was tried on trails#8663 and removed in review). Still live on origin/main: autosave-association.test.ts:2766 expects 'Validation failed: Publishedbooks is invalid' where Rails expects 'Published books'."
closed-reason: null
---

## Context

Surfaced by `ar-read-attribute-for-validation-is-not-send`.

Rails' `human_attribute_name` falls back to `attribute.to_s.humanize`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/translation.rb:67-71`), and `Error.full_message` builds
its default the same way (`vendor/rails/v8.0.2/activemodel/lib/active_model/error.rb:50`). A Rails attribute or
association name is snake_case, so `:published_books` humanizes to `"Published books"`.

In trails an association's name is its member's name, camelCase (`publishedBooks`), and an error on
it is keyed by that name: `errors.add(reflection.name)` in `validate_collection_association` and
`save_collection_association` (`vendor/rails/v8.0.2/activerecord/lib/active_record/autosave_association.rb:451`).
`humanize("publishedBooks")` is `"Publishedbooks"`.

So a full message for an error on a multi-word association reads "Publishedbooks is invalid" where
Rails reads "Published books is invalid", and `humanAttributeName("publishedBooks")` and a
`%{attribute}` interpolation read "Publishedbooks". `packages/activemodel/src/error.ts`
`Error.fullMessage` and `packages/activemodel/src/translation.ts` `humanAttributeName` are Rails'
bodies; the difference is the name's spelling.

Before trails#8663 one autosave site underscored the reflection name before `errors.add`, so that one
path read "Published books". The key it produced names no member, and `read_attribute_for_validation`
is `send` (`validations.rb:437`), so trails#8663 made it `errors.add(reflection.name)`, as Rails has it.
`packages/activerecord/src/autosave-association.test.ts` "rollbacks whole transaction and raises
ActiveRecord::RecordInvalid when associations fail to #save! due to uniqueness validation failure"
expects the member's spelling, "Validation failed: Publishedbooks is invalid", where Rails'
`autosave_association_test.rb` expects "Validation failed: Published books is invalid".

An `underscore` before `humanize` in `Error.fullMessage` was tried in trails#8663 and removed in
review: `fullMessage` is an uncompared pair, so `pnpm parity:api:arms:throws` reds an `@inventedArm`
receipt on it, and the call cannot be cited at its site.

Not decided, and the owner's to decide:

- whether an i18n lookup key for a camelCase attribute (`activerecord.attributes.author.publishedBooks`,
  `errors.models.author.attributes.publishedBooks.invalid`) keeps the member's spelling or takes the
  snake_case one a Rails locale file has;
- where the conversion to the Rails spelling then lives (CLAUDE.md § "An action's name is its method's
  name" ratifies an `underscore` at each site that turns an action name into a file name or locale key).

## Acceptance criteria

- [ ] The spelling of a camelCase attribute name in a human name and in an i18n lookup key is decided and recorded.
- [ ] A full message and `humanAttributeName` for a camelCase association name read as Rails' do for the snake_case one, and the autosave test above expects Rails' string again.
