---
title: "Port Turbo::Streams::TagBuilder and TurboStreamsTagBuilder"
status: draft
updated: 2026-11-12
rfc: "0000-hotwire-via-vite"
cluster: turbo
packages: [turbo-rails]
deps: [turbo-rails-package-helpers-and-turbo-stream-format]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/turbo-rails/v2.0.23/app/models/turbo/streams/tag_builder.rb:43-289` holds 20 actions:
`remove`, `replace`, `update`, `before`, `after`, `append`, `prepend`,
`refresh`, their `_all` forms, `action` and `action_all`, plus the private
`render_template` (`:262`) and `render_record` (`:281`).
`app/controllers/turbo/streams/turbo_streams_tag_builder.rb:1-22` hooks it
into controllers. The `streams_helper.rb:27` `turbo_stream` reader returns
it. Tests: the TagBuilder arms in `vendor/turbo-rails/v2.0.23/test/streams/streams_helper_test.rb`
and `streams_controller_test.rb`.

## Acceptance criteria

- Every action is ported with the Rails parameter order, `(target, content =
null, …rendering, block)`. The block uses the settled ruby-compat block
  idiom.
- `render_template`'s branches (content, a block, a partial, an inferred
  record render) are in the same order as in Rails.
