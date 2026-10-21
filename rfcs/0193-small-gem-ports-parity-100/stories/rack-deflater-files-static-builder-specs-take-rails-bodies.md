---
title: "rack-deflater-files-static-builder-specs-take-rails-bodies"
status: draft
updated: 2026-10-21
rfc: "0193-small-gem-ports-parity-100"
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

Split from `rack-remaining-specs-take-rails-bodies`, which converged `spec_body_proxy.rb`,
`spec_common_logger.rb`, `spec_mock_request.rb`, `spec_directory.rb`,
`spec_rewindable_input.rb` and `spec_mock_response.rb` and hit the LOC ceiling.

Still left, per `pnpm parity:test --package rack --assertions --missing`:

- `packages/rack/src/deflater.test.ts` vs `vendor/rack/v3.1.14/test/spec_deflater.rb` (27 count mismatches)
- `packages/rack/src/files.test.ts` vs `vendor/rack/v3.1.14/test/spec_files.rb` (17; plus 2 TS-only tests)
- `packages/rack/src/static.test.ts` vs `vendor/rack/v3.1.14/test/spec_static.rb` (18; value mismatches show the tests use an invented `fallback` app and tmpdir tree instead of Rails' `DummyApp` / `test/cgi` DOCROOT)
- `packages/rack/src/builder.test.ts` vs `vendor/rack/v3.1.14/test/spec_builder.rb` (11; plus 2 TS-only tests)

The rack `test/cgi` DOCROOT fixtures now live at `packages/rack/test/cgi/` (copied from
`vendor/rack/v3.1.14/test/cgi/`), except `cgi/assets/**`, which `spec_static.rb` needs: copy it
in this story. `spec_builder.rb` also needs `vendor/rack/v3.1.14/test/builder/*.ru`.

Residual kinds from the parent: `spec_common_logger.rb` "log in common log format" asserts
`(0..1).must_include duration` (Range include; trails asserts `Range#isInclude` truthy), and
`spec_mock_response.rb` "optionally makes Rack errors fatal" (`must_raise(...).message`).

## Acceptance criteria

- [ ] Each of the four files takes the Rails test bodies verbatim (same fixtures, same apps, same assertions).
- [ ] 0 assertion-count, kind and value mismatches for these files in `parity:test --package rack --assertions`.
- [ ] TS-only tests in these Rails-named files move to `*.trails.test.ts` or are deleted.
