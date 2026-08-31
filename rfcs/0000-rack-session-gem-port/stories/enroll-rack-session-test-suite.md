---
title: "Enroll rack-session's 124-test suite in parity:test, with PERMANENT-SKIP stubs for the unported files"
status: draft
updated: 2026-08-31
rfc: "0000-rack-session-gem-port"
cluster: null
packages: ["rack-session"]
deps: ["port-rack-session-session-hash", "port-rack-session-abstract-persisted-bodies", "port-rack-session-encryptor", "port-rack-session-cookie"]
deps-rfc: []
est-loc: 700
priority: 8
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The measure the whole RFC is for. `vendor/rack-session/test/` holds 7 files and
**124 tests** — verified by running this repo's own extractor over a `v2.1.0`
clone:

```
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

**All seven files are in scope.** By the time this story runs, every `.rb` in
the gem's `libPath` except `constants.rb` / `version.rb` has a port: `abstract/
id.rb` (`relocate-…`, `port-rack-session-session-hash`,
`port-rack-session-abstract-persisted-bodies`), `pool.rb` (`relocate-…`),
`encryptor.rb` (`port-rack-session-encryptor`), `cookie.rb`
(`port-rack-session-cookie`). Nothing is stubbed for want of an implementation.

The only tests that cannot pass are the ones asserting on **Ruby's `Marshal`
binary wire format**, which trails deliberately does not have:
`packages/activesupport/src/messages/serializer-with-fallback.ts:11` — *"trails
has no Ruby Marshal runtime, so the `:marshal` format is backed by the JSON
serializer"* — with the affected Rails files already registered in
`scripts/api-compare/unported-files.ts` (`marshalling.rb`,
`marshal_serialization_test.rb`). Follow that precedent.

Grepped, the reach is ~12 tests, not two whole files:

- `spec_session_cookie.rb` names `Marshal` on 12 lines across ~10 of its 48
  tests — the `Base64::Marshal` coder block (`:108-124`), the legacy-HMAC
  fixtures (`:337`, `:407`, `:420`), and the coder-name assertions (`:512`,
  `:517`).
- `spec_session_encryptor.rb` on 2 of its 16 (`:106`
  `Marshal.dump('').bytesize`; `:148` `Marshal.load` raising `TypeError`).

Draw the exact line per test — a test can be Marshal-*flavoured* without
asserting on the wire format, and those should pass. Only the ones that
genuinely cannot get a `PERMANENT-SKIP` stub carrying the Ruby name verbatim
plus an `unported-files.ts` row. If the count comes out materially above ~12,
say so in the PR rather than quietly lowering the RFC's Verification target
(RFC open question 4).

**700 LOC across 7 files will not fit one PR.** Ship the `abstract/id.rb` group
(43 tests) plus `spec_session_pool.rb` (17) first and file the two large specs
as their own story with `pnpm tasks new` — do not fan out PRs yourself.

Never rename or reword a test name; `parity:test` matches on names.

## Acceptance criteria

- Ported test files live at the paths `rubyToConventionTs` derives for
  `rack-session` (settled by `enroll-rack-session-in-compare-tooling`), with
  names verbatim from the Ruby.
- `pnpm parity:test` credits **≥ 112 of the 124** rack-session tests (this
  story plus its filed continuation, if the split is needed), and
  `parity:test:assertions` reports no new mismatch over the committed mark.
- Every test that does not pass is a Marshal-wire-format test with a
  `PERMANENT-SKIP` stub carrying the Ruby name verbatim and an
  `unported-files.ts` row; no test is skipped for want of a port.
- No test name is renamed or reworded; deltas for every other package are
  non-negative.
