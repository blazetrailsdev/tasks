---
title: "Port controller/content_type_test.rb under its Rails test names"
status: draft
updated: 2026-09-28
rfc: "0161-actioncontroller-rendering-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "port-actionpack-abstract-unit-test-support",
    "controller-render-converges-onto-abstract-controller-render",
  ]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionpack/test/controller/content_type_test.rb` has 14
tests: `ContentTypeTest` (`:71-139`, 11) and `AcceptBasedContentTypeTest`
(`:158-174`, 3). `pnpm parity:test --package actioncontroller` reports 0/14 with
13 missing and 14 extra, because
`packages/actionpack/src/action-controller/controller/content-type.test.ts`
spells every name with a leading "test" word (e.g. `it("test render defaults")`).
`scripts/test-compare/extract-ruby-tests.rb:691` derives the Rails name as
`name.sub(/^test_/, "").tr("_", " ")`, so `def test_render_defaults` is
`"render defaults"`. The current spelling is the drift; re-spelling it is
convergence, not a rename (the precedent is RFC 0139's
`journey-test-names-to-rails-def-test-form`).

The 14th, `content type with charset` (`:139`), is reported misplaced in
`action-dispatch/dispatch/request.test.ts`. It is not: that is the port of
`dispatch/request_test.rb:1040`'s own test of the same name, a cross-package
collision (RFC 0167's `test-compare-misplaced-ignores-other-packages-rails-names`).

## Acceptance criteria

- Each test carries the extractor's Rails name and sits under the Rails class.
- Test bodies match the Rails bodies; any extra assertion the trails version
  makes that Rails does not moves to a `.trails.test.ts` twin.
- `content type with charset` is ported here; `request.test.ts` is not edited.
- `pnpm parity:test --package actioncontroller` reports the file 14/14 with no
  extra.
