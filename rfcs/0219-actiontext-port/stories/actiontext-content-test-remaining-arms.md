---
title: "actiontext-content-test-remaining-arms"
status: ready
updated: 2026-11-14
rfc: "0219-actiontext-port"
cluster: null
packages: []
deps:
  - actiontext-content-helper-and-views
  - actiontext-record-rich-text-and-attribute
  - actiontext-model-tests-and-fixture-set
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9998 ported `ActionText::Content` / `Rendering` (`vendor/rails/v8.0.2/actiontext/lib/action_text/content.rb`, `rendering.rb`) and 14 of `vendor/rails/v8.0.2/actiontext/test/unit/content_test.rb`'s 25 tests. One test ("delegates pattern matching to Nokogiri") is a permanent skip. The other 10 are `it.skip` in `packages/actiontext/test/unit/content.test.ts` because they wait on other stories:

- `include Rendering, Serialization, ContentHelper` (`content.rb:25`): only `Rendering` is included. `sanitizeContentAttachment` is typed on `Content` but nothing installs it, so `renderAttachments` throws on a `content` attribute.
- Rendering (`ContentHelper` + the `action_text/contents` templates, from `actiontext-content-helper-and-views`): "renders with layout when ApplicationController is not defined", "renders with layout when in a new thread", "does basic sanitization", "does custom tag sanitization", "sanitizes attachment markup for Trix", "removes content attribute if it's value is empty", "removes content attribute if it's value is empty after sanitization". The `content_from_html` helper's `assert_nothing_raised { content.to_s }` (`content_test.rb:236-240`) is dropped until then.
- `Serialization` (from `actiontext-record-rich-text-and-attribute`): "marshal serialization".
- `create_file_blob` in the actiontext test helper (from `actiontext-model-tests-and-fixture-set`): "extracts attachables", "identifies destroyed attachables as missing".

## Acceptance criteria

- `Content` includes `Serialization` and `ContentHelper` as `content.rb:25` does.
- The 10 tests above run and pass, with Rails' bodies.
- `contentFromHtml` asserts `toString()` raises nothing, as `content_test.rb:236-240` does. If TSE cannot output a promise-valued `to_s`, a story is filed against actionview with the failing template.
