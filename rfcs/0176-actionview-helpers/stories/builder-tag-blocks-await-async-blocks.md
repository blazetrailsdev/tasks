---
title: "builder-tag-blocks-await-async-blocks"
status: done
updated: 2026-10-25
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9308
claim: "2026-10-25T15:12:12Z"
assignee: "builder-tag-blocks-await-async-blocks"
blocked-by: null
closed-reason: null
---

## Context

`Builder::XmlBase#tag!` (`packages/builder/src/xmlbase.ts:49`) runs a tag's block synchronously, so a `.builder` template whose block awaits (a `render` or `yield`, async in trails) closes the tag before the awaited output lands. Rails' `vendor/rails/v8.0.2/actionview/test/fixtures/actionpack/test/hello_world_container.builder` renders a partial inside `xml.test do ... end` that writes `xm.hello` into the open tag; the trails fixture `packages/actionview/src/test-helpers/fixtures/actionpack/test/hello-world-container.builder` renders `<test>\n</test>\n` instead of Rails' `<test>\n  <hello/>\n</test>\n`. `layouts/builder.builder` and `test/hello.builder` hoist their awaited value out of the block as a workaround.

## Acceptance criteria

- `tag!`/`method_missing` await a block that returns a promise (the tag closes after it settles), and the builder handler's output awaits the root tag.
- `hello-world-container.builder` renders `<test>\n  <hello/>\n</test>\n`; `layouts/builder.builder` and `test/hello.builder` move their awaited call back inside the block as Rails writes it.
