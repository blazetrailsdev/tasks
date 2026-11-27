---
title: "playground-generate-modal-browses-generators"
status: draft
updated: 2026-11-27
rfc: "0136-trailmap"
cluster: null
packages: []
deps:
  - move-browser-sqlite-into-website-as-playground
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

The playground's Generate button (`examples/browser-sqlite/index.html:56`) opens a free-text prompt, "bin/trails generate (model, migration, scaffold, controller…)" (`src/host/main.ts:449-460`), and posts the line as `host:generate` to the runtime, which runs it via `generate()` in `src/runtime/generate.ts:75-78` (`generatorModule` at `:57` resolves a generator's module).

## Acceptance criteria

- Generate opens a modal listing every generator `bin/trails generate` offers (enumerated from trailties, not hard-coded), browsable/searchable, each with its description.
- Selecting a generator shows its arguments and options (from its Thor definition) as a form; submitting runs it through the existing `host:generate` path and logs the equivalent `$ bin/trails generate …` command.
- The free-text prompt is removed; smoke drives the modal to generate a model.
