---
title: "activemodel: human_attribute_name and its i18n keys for a camelCase attribute name"
status: draft
updated: 2026-10-07
rfc: "0180-activerecord-receipt-parity"
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

Surfaced by `ar-read-attribute-for-validation-is-not-send`.

Rails' `human_attribute_name` falls back to `attribute.to_s.humanize`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/translation.rb:67-71`), and `Error.full_message` builds
its default the same way (`vendor/rails/v8.0.2/activemodel/lib/active_model/error.rb:50`). A Rails attribute or
association name is snake_case, so `:published_books` humanizes to `"Published books"`.

In trails an association's name is its member's name, camelCase (`publishedBooks`), and an error on
it is keyed by that name: `errors.add(reflection.name)` in `validate_collection_association` and
`save_collection_association` (`vendor/rails/v8.0.2/activerecord/lib/active_record/autosave_association.rb:451`).
`humanize("publishedBooks")` is `"Publishedbooks"`.

`packages/activemodel/src/translation.ts` `humanAttributeName` and
`packages/activemodel/src/error.ts` `Error.fullMessage` therefore call `underscore` on the name before
`humanize` (trails#8663). Neither carries a receipt: both declarations are uncompared pairs, and
`pnpm parity:api:arms:throws` reds an `@inventedArm` on a declaration no skeleton row is written for. Before that, one
autosave site underscored the reflection name before `errors.add`, which keyed the error by a name
no member answers (`read_attribute_for_validation` is `send`, `validations.rb:437`).

Not decided, and the owner's to decide:

- whether an i18n lookup key for a camelCase attribute (`activerecord.attributes.author.publishedBooks`,
  `errors.models.author.attributes.publishedBooks.invalid`) keeps the member's spelling or takes the
  snake_case one a Rails locale file has;
- whether the `underscore` before `humanize` is then a ratified shape (as CLAUDE.md § "An action's
  name is its method's name" ratifies it for action names) or is removed by a different one.

## Acceptance criteria

- [ ] The spelling of a camelCase attribute name in a human name and in an i18n lookup key is decided and recorded.
- [ ] The two `underscore` calls in `translation.ts` and `error.ts` are either converged away or cited against that decision.
