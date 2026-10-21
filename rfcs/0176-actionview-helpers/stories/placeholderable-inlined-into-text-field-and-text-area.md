---
title: "placeholderable-inlined-into-text-field-and-text-area"
status: ready
updated: 2026-10-21
rfc: "0176-actionview-helpers"
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

`pnpm parity:api` (forced run, 2026-10-20) lists
`helpers/tags/placeholderable.rb` among actionview's 6 missing files:
`helpers/tags/placeholderable.ts` does not exist. Its 1 method is already
credited elsewhere (0 missing), so this is a file/placement gap, not lost
behaviour — but the behaviour is missing too, which is why
`form_helper_test.rb` is short the whole `text field placeholder ...` family
(see the form_helper residue story).

`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/tags/placeholderable.rb:7-20`
is a module whose only member is `initialize(*)`: it calls `super`, then reads
`@options[:placeholder]`, resolves a String / `TrueClass` / method-and-value
`tag_value` through `Tags::Translator` with `scope: "helpers.placeholder"`,
falls back to `@method_name.humanize`, and writes `@options[:placeholder]`
back.

Rails includes it into `Tags::TextField` and `Tags::TextArea`
(`packages/actionview/src/helpers/tags/text-field.ts`,
`helpers/tags/text-area.ts` are the trails files). A module `initialize` has no
JS chain, so per root CLAUDE.md § "A module's `initialize` is inlined into the
constructor" the body is inlined into each includer's constructor at the
`super` position with an `@inlinedFrom` tag.

## Acceptance criteria

- `helpers/tags/placeholderable.ts` exists mirroring the Ruby file; the
  `initialize` body is inlined into the `TextField` and `TextArea`
  constructors, each carrying
  `@inlinedFrom ActionView::Helpers::Tags::Placeholderable#initialize rails/v8.0.2/actionview/lib/action_view/helpers/tags/placeholderable.rb:7-20`.
- `pnpm parity:api:inlined` is green and the citation matches `rails-api.json`
  (`pnpm parity:api:inlined:fix` writes it).
- `pnpm parity:api` shows actionview files at 104/109 or better.
- The `text field placeholder ...` tests pass, or are left to the form_helper
  residue story with the behaviour in place.
