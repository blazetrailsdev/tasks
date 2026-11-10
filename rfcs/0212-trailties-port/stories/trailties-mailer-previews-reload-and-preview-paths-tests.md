---
title: "trailties-mailer-previews-reload-and-preview-paths-tests"
status: done
updated: 2026-11-10
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9942
claim: "2026-11-10T00:53:50Z"
assignee: "trailties-mailer-previews-reload-and-preview-paths-tests"
blocked-by: null
closed-reason: null
---

# Port the remaining mailer_previews_test.rb reload and preview_paths tests

## Context

`packages/trailties/test/application/mailer-previews.test.ts` ports most of `vendor/rails/v8.0.2/railties/test/application/mailer_previews_test.rb`. These are still missing:

- "mailer previews are loaded from custom preview_paths" (`:104`). Blocked: a preview file that Zeitwerk shadows goes through plain `Kernel.require` and is never registered with `DescendantsTracker`, which in trails learns of a subclass only through `_registerAutoloaded` (`packages/trailties/lib/application/finisher.ts`). Ruby's `Class#subclasses` tracks every class.
- "mailer previews are reloaded across requests" (`:141`), "mailer preview actions are added and removed" (`:179`), "mailer previews are reloaded from custom preview_paths" (`:278`).

## Acceptance criteria

- The four tests are ported with verbatim names (`rails` → `trails`), using the file's helpers.
- A plain-required class reaches `DescendantsTracker` the way `Class#subclasses` would see it, fixed at its Rails-named site or filed with the Rails `file:line`.
