---
title: "actionview-render-plain-is-async-inside-capture-block"
status: in-progress
updated: 2026-10-20
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9159
claim: "2026-10-20T23:48:07Z"
assignee: "actionview-render-plain-is-async-inside-capture-block"
blocked-by: null
closed-reason: null
---

## Context

`AssertionsTest` "uses the output_buffer for assert_select" (`vendor/rails/v8.0.2/actionview/test/template/test_case_test.rb:369-383`)
renders `form_tag("/foo") { safe_concat render(plain: "<ul><li>foo</li></ul>") }`. In trails `ActionView::Base#render`
(`packages/actionview/src/base.ts`) returns a Promise even for `plain:`, and `CaptureHelper#capture`
(`packages/actionview/src/helpers/capture-helper.ts:11-34`) is synchronous, so the `<ul>` lands outside the `<form>`.
Parked in `packages/actionview/src/template/test-case.test.ts`.

## Acceptance criteria

- A `render(plain:)` (or any render) inside a `capture`d block lands inside the captured content, and the parked test runs with the Rails body.
