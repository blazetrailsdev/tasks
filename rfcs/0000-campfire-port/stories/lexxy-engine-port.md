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
and `active_storage/blob_with_preview_url.rb`. The browser editor is the npm
package, a dependency.

## Acceptance criteria

- [ ] lexxy vendored, `packages/lexxy` with each Ruby file ported
- [ ] the FormHelper / FormBuilder reopen follows the 2026-11-17 ActionText ruling, or an operator question is filed first
- [ ] the gem's Ruby tests ported and passing
