---
title: "Port the remaining 72 methods of Rails::Generators::AppBase"
status: claimed
updated: 2026-11-01
rfc: "0212-trailties-port"
cluster: tt-surface
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: "2026-11-01T02:31:32Z"
assignee: "trailties-app-base-remaining-surface"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/railties/lib/rails/generators/app_base.rb` (814 lines) scores 23/95.
AppBase is the shared parent of AppGenerator and PluginGenerator, so the
plugin generator stories need it. Bundler/Gemfile arms are RFC 0171's
`converge-generators-actions-gemfile-family-onto-package-json`.

## Acceptance criteria

- Every non-Bundler AppBase method missing from
  `packages/trailties/src/generators/app-base.ts` is ported at its Rails name.
  The class options and `skip_*?` predicates come first.
- The Bundler arms are left for 0171 and listed in the PR body.
- If it does not fit in one PR, ship the predicates and options, and file the
  rest as a new story.
