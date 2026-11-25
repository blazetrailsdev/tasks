---
title: "generator-class-paths-actiontext-actionmailbox-stimulus"
status: draft
updated: 2026-11-25
rfc: "0259-near-complete-packages-to-100"
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

Split from `generator-class-paths-for-remaining-gem-generators`, which seated
solid-cache's `SolidCache::InstallGenerator` (`lib/./generators` in
`vendor/sources.ts`, `generators/` in `LAZY_DIRS` of
`scripts/api-compare/class-paths.ts`, a `constant-residue.json` residue row,
and `packages/solid-cache/test/generators/lookup.trails.test.ts`). Three
generators are still unseated, so `Base.namespace`
(`vendor/rails/v8.0.5.2/railties/lib/rails/generators/base.rb:54-57`) cannot
derive their namespace from a class path:

- actiontext: `ActionText::Generators::InstallGenerator`
  (`vendor/rails/v8.0.5.2/actiontext/lib/generators/action_text/install/install_generator.rb`).
  In trails#10726 its compare stopped on an unrelated
  `@inlinedFrom Placeholderable#initialize` error.
- actionmailbox: `ActionMailbox::Generators::InstallGenerator`
  (`vendor/rails/v8.0.5.2/actionmailbox/lib/generators/action_mailbox/install/install_generator.rb`).
- stimulus: `StimulusGenerator`
  (`vendor/stimulus-rails/*/lib/generators/stimulus/stimulus_generator.rb`).

Recipe: add the generators path to the source's `extraLibPaths`, the
package's `generators/` to `LAZY_DIRS`, run
`pnpm tsx scripts/api-compare/class-paths.ts --check --record --package <pkg>`
then `pnpm parity:class-paths`, import the generated table from the generator,
and converge or receipt the call rows the newly measured bodies surface.

## Acceptance criteria

- Each generator's Ruby class path is in the manifest and its generated table,
  and `findByNamespace("<gem>:install")` (`"stimulus"` for stimulus) resolves it,
  with a lookup test that fails without the seat.
- Surfaced call / call-arg rows are converged or receipted with CONVERGEABLE stories.
