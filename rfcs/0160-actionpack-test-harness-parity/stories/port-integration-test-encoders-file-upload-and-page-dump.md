---
title: "port-integration-test-encoders-file-upload-and-page-dump"
status: ready
updated: 2026-09-30
rfc: "0160-actionpack-test-harness-parity"
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

`port-integration-test-application-and-encoders` ported the first eight classes of
`vendor/rails/v8.0.2/actionpack/test/controller/integration_test.rb:745-1093` into
`packages/actionpack/src/action-controller/controller/integration.test.ts`. The last
three classes did not fit its PR's LOC ceiling:

| Rails class                                     | Missing |
| ----------------------------------------------- | ------- |
| `IntegrationRequestEncodersTest` (`:1095-1273`) | 10      |
| `IntegrationFileUploadTest` (`:1275-1311`)      | 1       |
| `PageDumpIntegrationTest` (`:1313-1396`)        | 3       |

- The encoder tests exercise `RequestEncoder`
  (`action_dispatch/testing/request_encoder.rb`, trails
  `action-dispatch/testing/request-encoder.ts`) through `as: :json`,
  `IntegrationTest.registerEncoder` and `MimeType.register` / `unregister`.
- `IntegrationFileUploadTest` needs `fixture_file_upload` resolving against the class's
  `file_fixture_path` (`../fixtures/multipart`, trails
  `test-helpers/fixtures/multipart/ruby_on_rails.jpg`).
- `PageDumpIntegrationTest` needs `TestHelpers::PageDumpHelper` included into
  `IntegrationTest` (`integration.rb:665`). trails'
  `action-dispatch/testing/test-helpers/page-dump-helper.ts` diverges from
  `page_dump_helper.rb`: it roots the dump at `process.cwd()` rather than `Rails.root`,
  names it from `_testName` rather than `method_name`, and opens it with
  `xdg-open` / `open` where Rails `require "launchy"` and `warn`s
  "Please install the launchy gem to open the file automatically." on `LoadError`.

## Acceptance criteria

- Every test above is ported in Rails order under its Rails class.
- `pnpm parity:test --package actioncontroller` reports `controller/integration_test.rb`
  with none of these missing.
