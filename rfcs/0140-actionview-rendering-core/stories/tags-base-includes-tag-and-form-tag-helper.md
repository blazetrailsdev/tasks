---
title: "Tags::Base includes TagHelper and FormTagHelper (tags/base.rb:7)"
status: claimed
updated: 2026-09-30
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: 10
pr: null
claim: "2026-09-30T10:03:51Z"
assignee: "base-render-returns-nil-body-and-rejects-thenables"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/tags/base.rb:7` declares
`include Helpers::ActiveModelInstanceTag, Helpers::TagHelper, Helpers::FormTagHelper`, so
every `Tags::*` instance answers `label_tag`, `content_tag`, `tag`, `field_id`, and so on
as its own methods, with `ActiveModelInstanceTag` first in the ancestry. That ordering is
how its `content_tag` / `tag` overrides `super` into `TagHelper`.

trails' `packages/actionview/src/helpers/tags/base.ts` includes only
`ActiveModelInstanceTag`. As a result:

- `Tags::Label#render` (`tags/label.ts`) calls `labelTag.call(this, ...)` as a free function,
  where Rails calls its mixed-in `label_tag` (`tags/label.rb:61`).
- `labelTag` (`form-tag-helper.ts`) types its receiver as a structural `{ contentTag(...) }`
  because a `Tags::Label` is not a `FormTagHelperHost`.
- `ActiveModelInstanceTag#contentTag` / `#tag` (`active-model-helper.ts`) call the
  `contentTag` / `tag` free functions instead of `super`.

## Acceptance criteria

- `Tags::Base` includes `TagHelper` and `FormTagHelper` beneath `ActiveModelInstanceTag`,
  as `tags/base.rb:7` does (`include()` / `Included<>`), so `Base` instances satisfy
  `FormTagHelperHost`.
- `Label#render` calls `this.labelTag(...)`, and `labelTag`'s receiver is
  `FormTagHelperHost` again.
- `ActiveModelInstanceTag#contentTag` / `#tag` reach `TagHelper`'s implementation through
  the ancestry, as Rails' `super` does (`active_model_helper.rb:15-26`).
