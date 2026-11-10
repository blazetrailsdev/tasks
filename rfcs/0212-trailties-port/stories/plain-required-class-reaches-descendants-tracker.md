---
title: "plain-required-class-reaches-descendants-tracker"
status: draft
updated: 2026-11-10
rfc: "0212-trailties-port"
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

# A plain-required class reaches DescendantsTracker

## Context

`ActionMailer::Preview.load_previews` (`vendor/rails/v8.0.2/actionmailer/lib/action_mailer/preview.rb:120-124`)
requires each `*_preview.rb` and then reads `descendants`, which in Ruby is
native `Class#subclasses` (`vendor/rails/v8.0.2/activesupport/lib/active_support/descendants_tracker.rb:107-110`),
so every class a required file defines is seen.

In trails a subclass reaches `DescendantsTracker` only through the finisher's
`_registerAutoloaded` (`packages/trailties/lib/application/finisher.ts:289`),
an `on_load` callback Zeitwerk fires for files it autoloads. A file Zeitwerk
shadows (two preview roots each holding `notifier-preview.ts`) is loaded by
`Kernel.require`'s non-Zeitwerk arm (`packages/zeitwerk/lib/core-ext/kernel.ts:131-138`
→ `rbFRequireFile` → `rbFLoad`, `packages/ruby-compat/lib/load.ts:52-58`), and
its class is never registered. `Preview.all` then misses it.

Rails test: "mailer previews are loaded from custom preview_paths"
(`vendor/rails/v8.0.2/railties/test/application/mailer_previews_test.rb:104`),
parked as `it.skip` in `packages/trailties/test/application/mailer-previews.test.ts`.

## Acceptance criteria

- A class defined by a file loaded through `Kernel.require` (outside Zeitwerk)
  is visible to `DescendantsTracker#subclasses` / `descendants` of its
  superclass, without a per-caller registration step Rails does not have.
- "mailer previews are loaded from custom preview_paths" is un-skipped and passes.
