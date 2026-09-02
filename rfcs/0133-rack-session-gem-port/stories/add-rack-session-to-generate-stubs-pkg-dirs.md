---
title: "Give generate-stubs.ts a rack-session PKG_DIRS row so its unported-file stubs are generated, not hand-written"
status: in-progress
updated: 2026-09-02
rfc: "0133-rack-session-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: 15
pr: 7384
claim: "2026-09-02T12:03:27Z"
assignee: "add-rack-session-to-generate-stubs-pkg-dirs"
blocked-by: null
closed-reason: null
---

## Context

`scripts/test-compare/generate-stubs.ts` writes the `it.skip` stub files that
hold a Rails test file's names verbatim when the file is not ported. Its
`PKG_DIRS` map (`scripts/test-compare/generate-stubs.ts:26-36`) lists
`arel`, `activemodel`, `activerecord`, `activesupport`, `rack`,
`actiondispatch`, `actioncontroller`, `abstractcontroller` and `actionview`.

`rack-session` has no row, even though it has been an enrolled compare package
since `enroll-rack-session-in-compare-tooling` and its TS root
(`packages/rack-session/src/`) is already declared in `compare.ts:1482`.

PR #7356 needed stubs for `spec_session_cookie.rb` (48 names) and
`spec_session_encryptor.rb` (16 names) — both RFC 0133 non-goals. With no
`PKG_DIRS` row the generator emits nothing for the package, so the two files
were produced by hand from `output/rails-tests.json` in the generator's own
shape (nested `describe`s mirroring the Ruby `ancestors`, one `it.skip` per
name, `PERMANENT-SKIP:` marker in the body). That is 208 lines nobody has to
hand-write again, and hand-writing them is how a name drifts from the Ruby.

Note for whoever takes this: `describe.skip` is NOT a valid compaction.
`extract-ts-core.ts:567-587` marks a test pending only for `it.skip` / `it.todo`,
so a `describe.skip` wrapper would leave every contained test scored as
implemented and falsely credit the whole file.

## Acceptance criteria

- `PKG_DIRS` gains a `rack-session: "packages/rack-session/src/"` row, and
  `pnpm parity:test:stubs` emits stubs for the package's unported files.
- Re-running the generator over `spec_session_cookie.rb` /
  `spec_session_encryptor.rb` reproduces the committed files, or the diff is
  reviewed and the committed files are replaced by the generated ones.
- The generator's output keeps the `PERMANENT-SKIP:` marker
  `scripts/test-compare/normalize-skips.ts` string-matches, so a generated stub
  is not re-annotated on the next run.
