---
title: "Converge TestProcess#fileFixtureUpload onto Rack::Test::UploadedFile"
status: done
updated: 2026-09-04
rfc: "0137-rack-test-gem-port"
cluster: null
packages: []
deps: ["port-rack-test-uploaded-file"]
deps-rfc: []
est-loc: 250
priority: 13
pr: 7495
claim: "2026-09-04T20:26:02Z"
assignee: "port-permitted-scalar-types-list"
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::TestProcess::FixtureFile#file_fixture_upload`
(`vendor/rails/actionpack/lib/action_dispatch/testing/test_process.rb:12-27`)
returns a **`Rack::Test::UploadedFile`**:

```ruby
def file_fixture_upload(path, mime_type = nil, binary = false)
  ...
  Rack::Test::UploadedFile.new(path, mime_type, binary)
end
```

trails returns an `ActionDispatch::Http::UploadedFile` instead, and says so in
the code: `packages/actionpack/src/action-dispatch/testing/test-process.ts:88-91`
carries a `NOTE:` conceding that Rails uses `Rack::Test::UploadedFile` "which
opens the tempfile with binary encoding when `binary` is true. trails wraps
ActionDispatch's UploadedFile … so the flag is reflected in the part headers
only." The `binary` parameter is therefore silently doing something different
from Rails.

The two classes are genuinely different and both exist upstream —
`vendor/rails/actionpack/lib/action_dispatch/http/upload.rb` is what a request
parses a multipart part _into_; `vendor/rack-test/lib/rack/test/uploaded_file.rb`
is what a test hands _in_. trails collapsed them only because the second had no
file to port. `port-rack-test-uploaded-file` supplies it.

Downstream, `ActionController::Parameters`' permitted-scalar list names
`Rack::Test::UploadedFile` (`vendor/rails/actionpack/lib/action_controller/
metal/strong_parameters.rb:1311`). That was checked while scoping this RFC and
it is **not** in this story: trails' `isPermittedScalar`
(`strong-parameters.ts:72-77`) is missing six of the thirteen types, so
`params.permit` drops uploaded files today. It is filed whole as
`port-permitted-scalar-types-list`. Do not add the one entry here — a
half-converged list reads as a checked one.

## Acceptance criteria

- [ ] `fileFixtureUpload` / `fixtureFileUpload` in `test-process.ts` return a
      `Rack::Test::UploadedFile` from `@blazetrails/rack-test`, constructed as
      `new UploadedFile(path, mimeType, binary)` — Rails' positional order.
- [ ] The `NOTE:` conceding the divergence is deleted, not reworded: the `binary`
      flag now does what Rails' does.
- [ ] `packages/actionpack/src/action-dispatch/http/upload.ts` and
      `action-dispatch/dispatch/uploaded-file.test.ts` are unchanged — they mirror
      `http/upload.rb` and `test/dispatch/uploaded_file_test.rb` and keep their
      coverage.
- [ ] `parity:api` / `parity:test` deltas non-negative for actiondispatch; both call
      gates green with no new baseline rows.

## Definition of done

Rewording the `NOTE:` at `test-process.ts:88-91` into a better-justified
deviation does not close this story — a deviation register is a burndown
ledger, not permission (CLAUDE.md). Collapsing
`ActionDispatch::Http::UploadedFile` and `Rack::Test::UploadedFile` into one
trails class does not close it either: both exist upstream and are different.
