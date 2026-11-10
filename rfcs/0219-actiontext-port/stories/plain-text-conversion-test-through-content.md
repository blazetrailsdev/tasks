---
title: "plain_text_conversion_test: assert through Content and unskip the attachment test"
status: draft
updated: 2026-11-10
rfc: "0219-actiontext-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/actiontext/test/unit/plain-text-conversion.test.ts` (trails#9970) ports
`vendor/rails/v8.0.2/actiontext/test/unit/plain_text_conversion_test.rb`, but its
`assertConvertedTo` helper calls `Fragment.wrap(html).toPlainText()` where Rails'
`assert_converted_to` (`:143-145`) calls `ActionText::Content.new(html).to_plain_text`,
because `Content` was not ported yet. The `<action-text-attachment>` test (`:107-112`)
is `it.skip` because it needs `Content#to_plain_text`'s attachment rendering.

## Acceptance criteria

- `assertConvertedTo` uses `new Content(html).toPlainText()`, as Rails does.
- The `<action-text-attachment>` test is un-skipped and passes (19/19).
