---
title: "activestorage-attached-preview-tests"
status: draft
updated: 2026-11-02
rfc: "0209-activestorage-port"
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

`packages/activestorage/src/attached/one.test.ts` and `many.test.ts` still skip the preview tests of
`vendor/rails/v8.0.2/activestorage/test/models/attached/one_test.rb:819-839,895-919` and
`many_test.rb:879-897,955-961`. `Preview` now exists (`packages/activestorage/src/preview.ts`), and
they were left out only for the PR's LOC ceiling. Their `isPreviewImageNeededBeforeProcessingVariants`
stub on `Blob.prototype` sits at the head of both files and must go for the job-enqueue tests.
`preview(":thumb")` reaches `Attachment#preview`, which is async, and `ActiveStorage.variableContentTypes`
needs the image types set as `preview.test.ts` sets them.

## Acceptance criteria

- The seven named `it.skip`s in the two files (five in `one.test.ts`, three shared names in `many.test.ts`) are ported with Rails' assertions.
- The `Blob.prototype` preview stub is gone from both files.
