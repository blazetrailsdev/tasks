---
title: "Enroll rack-session's 124-test suite in parity:test, with PERMANENT-SKIP stubs for the unported files"
status: claimed
updated: 2026-09-01
rfc: "0133-rack-session-gem-port"
cluster: null
packages: ["rack-session"]
deps: ["port-rack-session-session-hash", "port-rack-session-abstract-persisted-bodies"]
deps-rfc: []
est-loc: 600
priority: 7
pr: null
claim: "2026-09-01T18:53:58Z"
assignee: "enroll-rack-session-test-suite"
blocked-by: null
closed-reason: null
---

## Context

The measure the whole RFC is for. `vendor/rack-session/test/` holds 7 files and
**124 tests** — verified by running this repo's own extractor over a `v2.1.0`
clone:

```console
TEST_PATHS_JSON='{"rack-session":"<clone>/test"}' ruby scripts/test-compare/extract-ruby-tests.rb
  → rack-session: 7 files, 124 tests   (0 adapter/feature-gated)
```

Per file: `spec_session_cookie.rb` 48, `spec_session_pool.rb` 17,
`spec_session_encryptor.rb` 16, `spec_session_abstract_session_hash.rb` 14,
`spec_session_abstract_persisted.rb` 12,
`spec_session_abstract_persisted_secure_secure_session_hash.rb` 11,
`spec_session_abstract_id.rb` 6.

They are minitest-spec `describe` / `it`, which `extract-ruby-tests.rb` handles
natively (its header lists Minitest::Spec first, and notes that the `def test_`
name mapping the gem suites use does **not** apply — so an `it "..."` name ports
verbatim, not through the `def test__plus__ex` → `"plus ex"` rule).

In scope to port: the four files covering ported code —
`spec_session_abstract_id.rb`, `spec_session_abstract_persisted.rb`,
`spec_session_abstract_session_hash.rb`,
`spec_session_abstract_persisted_secure_secure_session_hash.rb` (43 tests), plus
`spec_session_pool.rb` (17) — 60 tests total. If that exceeds the 700 LOC
ceiling, ship the abstract/id.rb four and file the Pool file as its own story;
do not fan out PRs yourself.

`spec_session_cookie.rb` (48) and `spec_session_encryptor.rb` (16) cover
`Rack::Session::Cookie` / `Encryptor`, RFC non-goals (Rails' `CookieStore`
subclasses `AbstractSecureStore`, not `Rack::Session::Cookie` —
`vendor/rails/actionpack/.../cookie_store.rb:52`). They get `PERMANENT-SKIP`
test stubs holding every Rails test name verbatim, per the established
unported-file shape — the stub is the file, so enrolling one later MODIFIES it.

Never rename or reword a test name; `parity:test` matches on names.

## Acceptance criteria

- Ported test files live at the paths `rubyToConventionTs` derives for
  `rack-session` (settled by `enroll-rack-session-in-compare-tooling`), with
  names verbatim from the Ruby.
- `pnpm parity:test` credits ≥ 60 of the 124 rack-session tests, and
  `parity:test:assertions` reports no new mismatch over the committed mark.
- `spec_session_cookie.rb` and `spec_session_encryptor.rb` have `PERMANENT-SKIP`
  stubs carrying all 64 Ruby test names.
- No test name is renamed or reworded; deltas for every other package are
  non-negative.
