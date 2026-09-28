---
title: "Port multipart_params_parsing_test.rb"
status: draft
updated: 2026-09-28
rfc: "0164-actiondispatch-http-parity"
cluster: null
packages: ["actionpack"]
deps:
  ["port-actionpack-abstract-unit-test-support", "port-actionpack-view-and-helper-test-fixtures"]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionpack/test/dispatch/request/multipart_params_parsing_test.rb`
is one class, `MultipartParamsParsingTest` (`:44-174`), with 15 tests and no
trails file. It posts the raw bodies in `test/fixtures/multipart/`
(`boundary_problem_file`, `bracketed_param`, `empty`, `large_text_file`,
`mixed_files`, `none`, `single_parameter`, `text_file`, `utf8_filename`,
`binary_file`, …) and asserts on `params`, `UploadedFile` and the tempfiles.
The fixtures are ported by RFC 0160's
`port-actionpack-view-and-helper-test-fixtures`.

## Acceptance criteria

- `dispatch/request/multipart-params-parsing.test.ts` ports all 15 tests in
  Rails order, reading the ported fixtures.
- The file reports 15/15.
