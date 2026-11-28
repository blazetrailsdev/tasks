---
title: "lexxy: port the engine's Ruby side"
status: draft
updated: 2026-11-27
rfc: "0000-campfire-port"
cluster: campfire-deps
packages: [lexxy, actiontext]
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design and Open question 3. lexxy 0.9.24's Ruby side is 281 lines:
`engine.rb`, `form_helper.rb` and `form_builder.rb` (reopen `rich_text_area`),
`rich_text_area_tag.rb`, `action_text_tag.rb`, `attachable.rb`,
`action_text/attachables/remote_video.rb`, `action_text/editor/lexxy_editor.rb`
and `active_storage/blob_with_preview_url.rb`. The browser editor ships built in
the gem as `app/assets/javascript/lexxy.js`; it is copied byte for byte, as
Bookshelf copies `house.min.js`.

The engine reopens `FormHelper` and `FormBuilder` after `ActionView::Base` has
included them. The operator's 2026-11-17 ruling licenses an includer list for
ActionText's reopen of those modules and "for no other module" (trails
CLAUDE.md, "A Ruby module is a JS object or a JS class"), so Lexxy needs its
own ruling (RFC Open question 3).

## Acceptance criteria

- [ ] lexxy vendored, `packages/lexxy` with each Ruby file ported
- [ ] the operator has ruled on Lexxy's `FormHelper` / `FormBuilder` reopen, and the port follows that ruling
- [ ] `lexxy.js` copied byte for byte and served from the package's assets, as the gem's engine serves it
- [ ] the new package registered as a new package needs (`ci.yml` lanes, the workspace guard fixture, `vendor/sources.ts`)
- [ ] the gem's Ruby tests ported and passing
