---
title: "Seat the generator class paths of solid-cache, actiontext, actionmailbox and stimulus"
status: draft
updated: 2026-11-24
rfc: "0259-near-complete-packages-to-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10713 made `Base.namespace` derive from the Ruby class path (`railties/lib/rails/generators/base.rb:54-57`). trails#10726 seated `SolidCable::*Generator` and `SolidQueue::*Generator` by adding `lib/./generators` to each gem's `extraLibPaths` (`vendor/sources.ts`) and `generators/` to `LAZY_DIRS` (`scripts/api-compare/class-paths.ts`). Four other packages ship generators that are still unseated:

- solid-cache: `class SolidCache::InstallGenerator` (`vendor/solid_cache/*/lib/generators/solid_cache/install/install_generator.rb`)
- actiontext: `ActionText::Generators::InstallGenerator` (`vendor/rails/v8.0.5.2/actiontext/lib/generators/action_text/install/install_generator.rb`)
- actionmailbox: `ActionMailbox::Generators::InstallGenerator`
- stimulus: `StimulusGenerator` (`vendor/stimulus-rails/*/lib/generators/stimulus/stimulus_generator.rb`)

When this was tried in #10726, solid-cache surfaced call-arg rows (`template "config/cache.yml"`, `production.rb` join, a missing `new`), and actiontext's compare stopped on an unrelated `@inlinedFrom Placeholderable#initialize` error.

## Acceptance criteria

- Each generator's Ruby class path is in the manifest and its generated table, and `findByNamespace("<gem>:install")` resolves it.
- The call-arg rows this surfaces are converged or receipted with CONVERGEABLE stories.
