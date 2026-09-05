---
title: "port-rack-test-multipart-spec"
status: ready
updated: 2026-09-05
rfc: "0137-rack-test-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 21
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split out of `port-rack-test-utils`, which ported `Rack::Test::Utils`
(`vendor/rack-test/lib/rack/test/utils.rb:5-155`) and
`spec/rack/test/utils_spec.rb`'s 26 cases but could not carry
`spec/rack/test/multipart_spec.rb`'s **24 cases**.

Every one of those 24 cases drives a full session — `post '/', 'photo' =>
uploaded_file` — against `spec/fixtures/fake_app.rb` and reads the result back
through `last_request.POST` / `last_request.env`
(`vendor/rack-test/spec/rack/test/multipart_spec.rb:22-49` and on). Neither
`Rack::Test::Session#post` nor the fake app exists until
`port-rack-test-session`, which is where `spec/fixtures/fake_app.rb` is scoped
(see that story's Context). So the file cannot be written before that story
lands, and it is not part of `Rack::Test::Utils` itself.

Target: `packages/rack-test/src/multipart.test.ts` — a test file with no
same-named source, which `packages/rack` already does. The fixtures the spec
uses (`foo.txt`, `bar.txt`, `mb.txt`) are already vendored at
`packages/rack-test/src/fixtures/`; `space case.txt` is not yet.

Note `converge-rack-query-parser-normalize-params`: three
`Rack::Test::Utils.build_multipart` cases are `it.skip`ped in
`packages/rack-test/src/utils.test.ts` on a repeated-`[]` divergence in
`@blazetrails/rack`'s `_normalizeParams`. `multipart_spec.rb`'s nested-params
cases read back through the same parser, so some of these 24 may land skipped on
that same story until it converges.

## Acceptance criteria

- [ ] `packages/rack-test/src/multipart.test.ts` credits all 24 cases of
      `spec/rack/test/multipart_spec.rb` under `parity:test`; no test name is
      reworded.
- [ ] `space case.txt` is vendored alongside the other fixtures if a ported case
      needs it.
- [ ] `pnpm parity:test` delta non-negative.
