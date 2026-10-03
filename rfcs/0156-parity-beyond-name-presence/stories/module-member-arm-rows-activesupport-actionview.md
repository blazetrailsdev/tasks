---
title: "activesupport, actionview: newly measured module-member arm rows"
status: draft
updated: 2026-10-03
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: ["activesupport", "actionview"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Pairing a module member and a top-level function of one name each with its own Rails body newly
measures these pairs in `pnpm parity:api:arms:report`:

- `activesupport/src/callbacks.ts#runCallbacks` (`:1200`, the mixin member): its whole body is one
  `runCallbacks` delegation, against Rails' full `run_callbacks`
  (`vendor/rails/v8.0.2/activesupport/lib/active_support/callbacks.rb:96-147`): `count -if -if -if
-loop -if -if -try -loop`.
- `activesupport/src/tagged-logging.ts#tagged` (`:192`): `count +if` against
  `vendor/rails/v8.0.2/activesupport/lib/active_support/tagged_logging.rb:141-151`.
- `actionview/src/helpers/cache-helper.ts#isCaching` (`:65`): `count +if`, `-or +and` against
  `CachingRegistry.caching?`, `@caching ||= false`
  (`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/cache_helper.rb:300-302`).

## Acceptance criteria

- [ ] Each body takes Rails' control flow, or the pairing is shown to be an artefact and separated in
      the comparer. Each row leaves the arms report.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green.
