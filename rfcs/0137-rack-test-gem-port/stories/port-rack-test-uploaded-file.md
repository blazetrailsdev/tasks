---
title: "Port Rack::Test::UploadedFile"
status: draft
updated: 2026-09-03
rfc: "0137-rack-test-gem-port"
cluster: null
packages: []
deps: ["enroll-rack-test-in-compare-tooling"]
deps-rfc: []
est-loc: 300
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Story 5 of the RFC, and the leaf the two collapse stories both depend on.
`Rack::Test::UploadedFile` is the single most-named rack-test constant in Rails
after `Methods` — 17 of the 55 `Rack::Test` mentions under `vendor/rails/`.

Source: `vendor/rack-test/lib/rack/test/uploaded_file.rb:14-98` (99 lines).
Surface: `original_filename` (`:16`), `tempfile` (`:19`), `content_type`
(`:22`), `initialize(content, content_type = 'text/plain', binary = false,
original_filename: nil)` (`:31`), `path` (`:46`), `method_missing` (`:52`),
`append_to` (`:60`), `respond_to_missing?` (`:71`), and the two private
constructors `initialize_from_stringio` (`:78`) and `initialize_from_file_path`
(`:86`).

Tests: `vendor/rack-test/spec/rack/test/uploaded_file_spec.rb`, **10 cases**,
mapping to `packages/rack-test/src/uploaded-file.test.ts`.

This is NOT `ActionDispatch::Http::UploadedFile`. Both classes exist upstream
and they are different: Rails' `test_process.rb:27` constructs the rack-test one
and hands it to a request, which parses it into the ActionDispatch one
(`vendor/rails/actionpack/lib/action_dispatch/http/upload.rb`). trails already
ports the ActionDispatch one at
`packages/actionpack/src/action-dispatch/http/upload.ts`; leave it alone.
Collapsing the two into a single trails class would be the inverse of fidelity.

The stdlib this class needs is already in the tree, in two different packages:
`StringIO` (branched on at `:36`) is `@blazetrails/ruby-compat`
(`packages/ruby-compat/src/string-io.ts:20`), `FileUtils` (`:3`) is
ruby-compat's `index.ts:41`, and `Tempfile` (`:4`, constructed at `:92`) is
still `packages/activesupport/src/tempfile.ts` — its move to ruby-compat
(`0129-ruby-compat/move-tempfile-to-ruby-compat`) is `blocked` on the
fs/os/crypto adapter seat. Import the `Tempfile` that exists; do not re-home it
here.

`method_missing` (`:52-58`) forwards to the wrapped `Tempfile`. Pick the settled
trails `method_missing` idiom; if the answer is to spell out the `IO` surface
trails actually calls, that is a `@missingRailsCall` receipt at one site, not a
design change (RFC Open Question 2).

## Acceptance criteria

- [ ] `packages/rack-test/src/uploaded-file.ts` ports the class member for member,
      in Rails source order, with the Rails names and parameter names.
- [ ] `packages/rack-test/src/uploaded-file.test.ts` credits all 10 cases from
      `uploaded_file_spec.rb` under `parity:test`; no test name is reworded.
- [ ] `packages/actionpack/src/action-dispatch/http/upload.ts` is unchanged.
- [ ] `pnpm parity:api` / `parity:test` deltas non-negative; `pnpm parity:api:calls`
      and `pnpm parity:api:calls:args` green with no new baseline rows.
