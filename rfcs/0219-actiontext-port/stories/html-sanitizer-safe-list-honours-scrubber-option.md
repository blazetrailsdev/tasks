---
title: "SafeListSanitizer#sanitize honours scrubber: (ContentHelper.scrubber is ignored)"
status: blocked
updated: 2026-11-16
rfc: "0219-actiontext-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: "needs a Loofah::Scrubber base class + fragment.scrub! port: port-loofah-scrubber-and-html5-scrub (trails#9420, merged) delivered only HTML5::SafeList/Scrub; git grep 'Scrubber' origin/main -- packages/html-sanitizer/lib packages/nokogiri/lib is empty and Rails::HTML scrubbers are still CONVERGEABLE html-sanitizer-port-scrubbers (sanitizer.ts:63,118,152)"
closed-reason: null
---

## Context

`ActionText::ContentHelper#sanitize_content_attachment` and `#sanitize_action_text_content`
(`vendor/rails/v8.0.2/actiontext/app/helpers/action_text/content_helper.rb:19-35`) pass
`scrubber: scrubber` to `sanitizer.sanitize`. Rails::HTML's `SafeListSanitizer#sanitize`
(`vendor/rails-html-sanitizer/.../lib/rails/html/sanitizer.rb`, `SafeList#sanitize`) runs the
given `scrubber:` instead of the tags/attributes permit scrubber.

trails' `SanitizeOptions` (`packages/html-sanitizer/lib/sanitizer.ts:30-33`) has only `tags` and
`attributes`, so `packages/actiontext/lib/content-helper.ts` passes `scrubber` behind an
`as SanitizeOptions` cast and it is ignored: `ContentHelper.scrubber = …` has no effect.
`sanitizeActionTextContent` also carries a `!` on the `sanitize` result where Rails' `.html_safe`
would raise on nil.

## Acceptance criteria

- `SanitizeOptions` gains `scrubber`, and `SafeListSanitizer#sanitize` honours it as Rails'
  `SafeList#sanitize` does (scrubber wins over tags/attributes).
- The two `as SanitizeOptions` casts in `content-helper.ts` are removed.
- A test sets `ContentHelper.scrubber` and shows it applied to rendered content.
