---
title: "Template lookup resolves test/hello_world_from_rxml to its kebab-case builder fixture"
status: claimed
updated: 2026-10-26
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-10-26T15:34:09Z"
assignee: "define-module-inline-methods-reach-the-api-extractor"
blocked-by: null
closed-reason: null
---

## Context

`overwriting rendering relative file with extension` in `packages/actionview/src/actionpack/controller/render.test.ts` stays `test.skip` under a stale `BLOCKED: port-builder-template-handler` marker. That story is done, and builder rendering works as of trails#9308. The test now fails earlier, on lookup: `ActionView::MissingTemplate: Missing template test/hello_world_from_rxml ... handlers: ["builder"]`.

Rails' `hello_world_from_rxml_using_template` / `_using_action` (`vendor/rails/v8.0.2/actionview/test/actionpack/controller/render_test.rb`) render `template: "test/hello_world_from_rxml"` and `action: "hello_world_from_rxml"` with `handlers: [:builder]`. The trails fixture is `packages/actionview/src/test/fixtures/actionpack/test/hello-world-from-rxml.builder` (kebab-case). The `template:` arm does not apply the snake→kebab mapping that packages/actionpack/CLAUDE.md "An action's name is its method's name" ratifies for file names.

## Acceptance criteria

- `template: "test/hello_world_from_rxml"` and `action: "hello_world_from_rxml"` both resolve the kebab-case fixture, as the action arm does elsewhere.
- The test is un-skipped with the Rails body and passes. The stale BLOCKED marker is removed.
