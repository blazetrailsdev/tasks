---
title: "engine-views-resolve-source-not-dist"
status: draft
updated: 2026-11-22
rfc: "0142-trailties-surfaced-deviations"
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

A package-shipped engine's `app/views` path resolves under its package root (Engine.findRoot), i.e. the
source `packages/<pkg>/app/views`, while `build:templates` compiles views in place under
`dist/app/views`, writing `dist/.trails/views/...`. ActionView then looks the compiled template up at
`<root>/.trails/views/...` (packages/actionview/lib/template.ts:84) and raises LoadError. Turbo hit this for
`layouts/turbo_rails/frame` (fixed in the chatter example PR by pointing turbo's `app/views` path at
`import.meta.dirname`, as its `app/helpers` already was). actiontext, actionmailbox and activestorage do the
same build and add no `app/views` path (their engine.ts), so their views likely fail the same way.

## Acceptance criteria

- Each engine that ships views renders one from a booted app that imports the package's dist.
- One mechanism, not a per-engine override, if the root/`.trails` mapping is the defect.
