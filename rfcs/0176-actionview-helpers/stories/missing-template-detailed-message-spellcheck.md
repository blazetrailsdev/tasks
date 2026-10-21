---
title: "missing-template-detailed-message-spellcheck"
status: claimed
updated: 2026-10-21
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 2
pr: null
claim: "2026-10-21T00:47:23Z"
assignee: "tse-undefined-local-raises-template-error"
blocked-by: null
closed-reason: null
---

## Context

`ActionView::MissingTemplate#detailed_message` appends a DidYouMean
"Did you mean?" list built by `MissingTemplate::Results` /
`checks_for_misspellings` (`vendor/rails/v8.0.2/actionview/lib/action_view/template/error.rb:38-110`).
trails' `MissingTemplate` (`packages/actionview/src/template/error.ts`) prints
the bare "Missing partial ..." message with no suggestions, so four
`render_test.rb` tests are parked as `it.skip` in
`packages/actionview/src/template/render.test.ts`:
`render partial provides spellcheck` (`render_test.rb:708`),
`spellcheck doesnt list directories` (`:713`),
`spellcheck only lists templates` (`:719`),
`spellcheck only lists partials` (`:726`).

## Acceptance criteria

- [ ] `MissingTemplate#detailedMessage` appends the Rails "Did you mean?" block, listing only templates or only partials as Rails does, and no directories.
- [ ] The four tests above are un-skipped and pass.
