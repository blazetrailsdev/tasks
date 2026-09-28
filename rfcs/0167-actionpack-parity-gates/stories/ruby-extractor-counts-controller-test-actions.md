---
title: "Stop counting controller actions named test_* as Rails tests"
status: draft
updated: 2026-09-27
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`process_def` (`scripts/test-compare/extract-ruby-tests.rb:676-689`) records
every `def test_*` whose parameters are all optional, and skips only methods
with required parameters. It never checks that the enclosing class is one
Minitest runs. Actionpack's test files define controllers with actions named
`test_*`, so `pnpm parity:test --package actioncontroller` counts 30 phantom
tests, all in classes that are `< ActionController::Base`:

| Rails file (`vendor/rails/v8.0.2/actionpack/test/controller/`) | Class                                                        | Rows |
| -------------------------------------------------------------- | ------------------------------------------------------------ | ---- |
| `test_case_test.rb`                                            | `TestController` (`:61-165`, e.g. `test_params`)             | 16   |
| `test_case_test.rb`                                            | `DefaultUrlOptionsCachingController` (`:210`)                | 1    |
| `send_file_test.rb`                                            | `SendFileController` (`:11`, `:31-67`)                       | 6    |
| `parameter_encoding_test.rb`                                   | `ParameterEncodingController` (`:5`)                         | 4    |
| `integration_test.rb`                                          | `IntegrationFileUploadTest::IntegrationController` (`:1277`) | 1    |
| `render_test.rb`                                               | `LiveTestController` (`:977`)                                | 1    |
| `render_to_string_test.rb`                                     | `TestController` (`:27`)                                     | 1    |

`dispatch/routing_test.rb`'s `TestErrorsInController` (`:5023`) ends in
`Controller` but is `< ActionDispatch::IntegrationTest` and is a real test
class; it must stay.

## Acceptance criteria

- The extractor skips `def test_*` in a class whose superclass the extractor can
  see is not a test case (a controller base, `::ApplicationController`, or a
  class defined in the same file that is itself not a test case) — decided by
  superclass, not by the class name's suffix.
- `pnpm parity:test --package actioncontroller` reports 708/1945 (was
  708/1975); actiondispatch keeps `TestErrorsInController`.
- Every other package's Ruby test count is unchanged, or the PR lists each file
  whose count moved and why.
