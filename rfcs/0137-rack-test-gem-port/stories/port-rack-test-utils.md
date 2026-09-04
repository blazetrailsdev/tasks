---
title: "Port Rack::Test::Utils and the MULTIPART constants"
status: blocked
updated: 2026-09-04
rfc: "0137-rack-test-gem-port"
cluster: null
packages: []
deps:
  [
    "enroll-rack-test-in-compare-tooling",
    "port-rack-test-uploaded-file",
    "port-string-b-binary-copy",
    "port-set-encoding-on-stringio-and-tempfile",
  ]
deps-rfc: []
est-loc: 350
priority: 6
pr: null
claim: "2026-09-04T19:45:19Z"
assignee: "port-rack-test-utils"
blocked-by: "Dependency port-rack-test-uploaded-file is still unmerged (PR #7481, OPEN), so Rack::Test::UploadedFile does not exist in main: build_multipart's 'case value when UploadedFile' scan (utils.rb:43) and build_file_part's append_to (utils.rb:149) cannot be ported faithfully, and 13 of utils_spec.rb's 26 cases construct an UploadedFile. Separately, multipart_spec.rb's 24 cases all drive Session#post against spec/fixtures/fake_app.rb, neither of which lands until port-rack-test-session (story 8, not started) - so the multipart.test.ts half of this story's acceptance criteria is not buildable yet either. Unblock once #7481 merges; the multipart.test.ts criterion likely needs re-homing onto port-rack-test-session."
closed-reason: null
---

## Context

Story 6 of the RFC, and the prerequisite for collapsing actionpack's hand-rolled
multipart encoder.

Source: `vendor/rack-test/lib/rack/test/utils.rb:5-155` (156 lines) —
`build_nested_query` (`:11`), `build_multipart(params, _first = true, multipart
= false)` (`:34`), and the private helpers `normalize_multipart_params`
(`:62`), `build_parts` (`:94`), `_build_parts` (`:100`),
`build_primitive_part` (`:121`), `build_file_part` (`:133`). Plus the two
constants this module's output depends on, which live in the entry file:
`DEFAULT_HOST` (`vendor/rack-test/lib/rack/test.rb:33`) and
`MULTIPART_BOUNDARY = '----------XnJLe9ZIbbGUYtzPQJ16u1'` (`:36`) — port those
into `packages/rack-test/src/test.ts` here, since `build_multipart` is their
first consumer.

Tests: `spec/rack/test/utils_spec.rb` (**26 cases**, →
`packages/rack-test/src/utils.test.ts`) and `spec/rack/test/multipart_spec.rb`
(**24 cases**, → `multipart.test.ts` — a test file with no same-named source,
which `packages/rack` already does).

`build_multipart` writes file parts through `UploadedFile#append_to`
(`uploaded_file.rb:60`), which is why this depends on
`port-rack-test-uploaded-file`.

Scope note: no trails caller is redirected onto `build_nested_query` in this
story (trails' query building goes through `@blazetrails/rack`'s parser). It is
ported for surface and covered by `utils_spec.rb`; redirecting callers is not
part of this RFC.

The multipart builder appends `.b` on every line (`utils.rb:125,127,137,139,141,143`) and guards `uploaded_file.set_encoding(Encoding::BINARY)` on `respond_to?(:set_encoding)` (`:147-148`) — so a missing `setEncoding` does not raise, it takes the other branch and drops the file body. Both members are ruby-compat gaps with stories under RFC 0129 — see `deps`.

## Acceptance criteria

- [ ] `packages/rack-test/src/utils.ts` ports the module member for member in Rails
      source order, as a `this`-typed mixin per CLAUDE.md "Module mixins" (Rails
      `include Rack::Test::Utils`).
- [ ] `MULTIPART_BOUNDARY` and `DEFAULT_HOST` exported from
      `packages/rack-test/src/test.ts` with their exact Rails values.
- [ ] `utils.test.ts` and `multipart.test.ts` credit all 50 cases under
      `parity:test`; no test name is reworded.
- [ ] `pnpm parity:api` / `parity:test` deltas non-negative; both call gates green
      with no new baseline rows.
