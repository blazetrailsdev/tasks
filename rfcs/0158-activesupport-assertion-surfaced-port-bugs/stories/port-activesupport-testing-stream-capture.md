---
title: "Port ActiveSupport::Testing::Stream so tests stop hand-rolling stderr capture"
status: done
updated: 2026-09-25
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: trails#8065
claim: "2026-09-24T23:24:18Z"
assignee: "hwia-test-enumerator-and-yaml-remainder"
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::Testing::Stream` (`vendor/rails/activesupport/lib/active_support/testing/stream.rb`)
defines `silence_stream`, `quietly` and `capture(stream)`. `capture` redirects
`$stdout`/`$stderr` to a tempfile for the duration of the block and returns what was
written (`stream.rb:29-42`). It is mixed into `ActiveSupport::TestCase` via
`ActiveSupport::Testing::Stream` and AR tests call it directly.

trails has no port. `packages/activesupport/src/testing/` holds `assertions.ts`,
`method-call-assertions.ts`, `constant-stubbing.ts` and friends, but no `stream.ts`.

`test_setting_invalid_pragma`
(`vendor/rails/activerecord/test/cases/adapters/sqlite3/sqlite3_adapter_test.rb:404-421`)
is `warning = capture(:stderr) { ... }; assert_match(/Unknown SQLite pragma: invalid/, warning)`.
Porting it in trails#7915 required hand-rolling a file-local `capture` helper over
`vi.spyOn(console, "warn")` in
`packages/activerecord/src/adapters/sqlite3/sqlite3-adapter.test.ts`. Five other
files already hand-roll their own stream capture under different names
(`captureStreams` in `adapters/sqlite3/sqlite-rake.test.ts` and
`adapters/mysql2/mysql2-rake.test.ts`, `captureStdio` in
`adapters/postgresql/postgresql-rake.test.ts`, `captureConsoleErrors` in
`activerecord-cli/src/__e2e__/helpers.ts`, `captureDeprecations` in
`connection-adapters/raw-connection-overload.trails.test.ts`), so the divergence is
already six-way.

## Converged shape

Port `ActiveSupport::Testing::Stream` as
`packages/activesupport/src/testing/stream.ts` with Rails' three members and Rails'
names — `silenceStream`, `quietly`, `capture` — `capture` taking Rails' `stream`
argument as the Ruby Symbol string (`":stderr"` / `":stdout"`, per CLAUDE.md
§ "A Ruby Symbol is a JS string"). Then replace the six hand-rolled helpers with it,
starting with `sqlite3-adapter.test.ts`'s file-local `capture`.

Note the underlying write target differs: Ruby's `warn` goes to `$stderr`, and trails'
pragma warning goes through `console.warn`. The port has to capture whichever stream
the trails side actually writes to, which is a decision to make once in `stream.ts`
rather than six times.

## Acceptance criteria

- `packages/activesupport/src/testing/stream.ts` exists, exporting `capture`,
  `silenceStream` and `quietly` against `stream.rb`.
- `sqlite3-adapter.test.ts`'s file-local `capture` is deleted in favour of it, and
  `setting invalid pragma` still passes with 0 assertion mismatches.
- `pnpm parity:api --package activesupport` delta is non-negative.
