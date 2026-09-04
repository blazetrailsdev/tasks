---
title: "screenshot-helper-display-image-reads-imagedata-instead-of-the-file"
status: ready
updated: 2026-09-04
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 39
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ScreenshotHelper#display_image`'s inline arm base64-encodes the screenshot it
reads off disk:

```ruby
when "inline"
  name = inline_base64(File.basename(absolute_image_path))
  image = inline_base64(File.read(absolute_image_path))
```

(`vendor/rails/actionpack/lib/action_dispatch/system_testing/test_helpers/screenshot_helper.rb:141-144`.)

trails' `displayImage`
(`packages/actionpack/src/action-dispatch/system-testing/test-helpers/screenshot-helper.ts:140-160`)
takes the bytes as an invented `imageData?: Buffer` parameter instead and
answers `""` when the caller passes none — so the `File.read` Rails makes is
absent, and its caller (`screenshot-helper.ts:33`) has to thread the buffer
through.

The omission was invisible to `parity:api:calls` until
`uploaded-file-read-drops-rails-length-and-buffer-arguments` (#PR) gave
actiondispatch a `read` that takes arguments, which is gate 2 of
`significantMissingCalls` (`scripts/api-compare/compare.ts:488-491`). It is
baselined in
`scripts/api-compare/call-mismatches-exclude/actiondispatch/system-testing/test-helpers/screenshot-helper.json`
with that reason.

## Acceptance criteria

- `displayImage`'s inline arm reads the file at its own call site, as
  `screenshot_helper.rb:143` does; the `imageData` parameter and the threading
  at `screenshot-helper.ts:33` are gone.
- The `display_image` / `read` row is deleted from the call-mismatches baseline
  and `pnpm parity:api:calls` stays green (tighten the mark if it goes stale).
