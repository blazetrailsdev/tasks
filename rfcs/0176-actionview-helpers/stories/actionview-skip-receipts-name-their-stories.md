---
title: "actionview skips: un-skip highlight sanitize, point builder and encoding skips at real receipts"
status: ready
updated: 2026-10-22
rfc: "0176-actionview-helpers"
cluster: null
packages: ["actionview"]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

An audit of every `it.skip` in `packages/actionview/src/**/*.test.ts` (2026-10-21)
found skips whose receipt names no story or names the wrong thing:

- `template/text-helper.test.ts:377` `highlight should sanitize input` is
  `BLOCKED` on prose ("sanitize() strips script tags but not their text content"),
  and its body asserts `"This is a <mark>beautiful</mark> morning"`. Rails asserts
  `"This is a <mark>beautiful</mark> morningcode!"`
  (`vendor/rails/v8.0.2/actionview/test/template/text_helper_test.rb:211-216`), and
  the built `highlight` already returns exactly that. The test body is wrong, not
  the helper.
- `actionpack/controller/render.test.ts:941,950,964,975,1193` (`render xml*`,
  `overwriting rendering relative file with extension`) and
  `template/lookup-context.test.ts:174` are `BLOCKED: template/handlers/builder.rb`,
  a file path rather than a story. They are owned by `port-builder-template-handler`.
- `template/capture-helper.test.ts:250` `with output buffer sets proper encoding`
  is an empty `it.skip` with no receipt. Its Rails body
  (`capture_helper_test.rb:216-229`) asserts `output_buffer.encoding` after
  `force_encoding`, which root CLAUDE.md § "A String has no encoding tag either"
  makes permanently unportable.

## Acceptance criteria

- `highlight should sanitize input` is un-skipped with Rails' expected string and passes.
- The six builder skips read `BLOCKED: port-builder-template-handler`.
- The encoding test keeps Rails' body under a `PERMANENT-SKIP:` line citing
  § "A String has no encoding tag either".
