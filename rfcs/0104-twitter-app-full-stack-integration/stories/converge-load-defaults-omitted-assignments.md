---
title: "converge-load-defaults-omitted-assignments"
status: draft
updated: 2026-09-01
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
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

`Configuration#loadDefaults` landed in #7349
(`packages/trailties/src/application/configuration.ts`) mirroring
`vendor/rails/railties/lib/rails/application/configuration.rb:70-355` branch
for branch, but four assignments inside otherwise line-for-line arms have no
trails receiver and are omitted in place. They are listed in the method's
JSDoc; this story converges them.

1. `ActiveSupport.utc_to_local_returns_utc_offset_times = true`
   (`configuration.rb:220`, the 6.1 arm). trails HAS the setter —
   `setUtcToLocalReturnsUtcOffsetTimes` in
   `packages/activesupport/src/core-ext/date-and-time/compatibility.ts` — but
   it is not on activesupport's index and `./core-ext/date-and-time/compatibility`
   is not an `exports` subpath in `packages/activesupport/package.json`, so
   trailties cannot reach it. This one is pure plumbing.
2. `self.dom_testing_default_html_version = defined?(Nokogiri::HTML5) ? :html5 : :html4`
   (`:276`, the 7.1 arm). The port assigns `":html4"` unconditionally; there
   is no Nokogiri and no HTML5-parser probe in trails.
3. `action_view.sanitizer_vendor = Rails::HTML::Sanitizer.best_supported_vendor`
   and the identical `action_text` line (`:313-323`, the 7.1 arm). Both
   `respond_to?` guards are ported and kept, with `/** @empty */` bodies —
   `Rails::HTML::Sanitizer` has no trails counterpart, so `sanitizer_vendor`
   has no value to take.
4. `Regexp.timeout ||= 1 if Regexp.respond_to?(:timeout=)` (`:344`, the 8.0
   arm). JS `RegExp` has no timeout knob.

## Converged shape

Take them one at a time; (1) is independent of the rest and is the smallest.

- (1): add the `exports` subpath (plus its four registrations — tsconfig
  path, vitest alias, package.json exports, and the importing package's
  dependency) or re-export the pair from activesupport's index, then make the
  6.1 arm call it.
- (2): once trails has an HTML5-parser probe, restore the ternary.
- (3): once a `Trails::HTML::Sanitizer` exists with `best_supported_vendor`,
  fill the two empty guards.
- (4): only if trails grows a regexp-timeout analogue; otherwise close (4)
  alone with a `@missingRailsCall` receipt naming this story.

## Acceptance criteria

- Each of the four is either assigned as Rails assigns it, or carries a
  permanence receipt at its site naming the reason it cannot be.
- The four-omission paragraph in `loadDefaults`' JSDoc shrinks accordingly.
