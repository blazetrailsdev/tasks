---
title: "No adapter exposes Process.uid, so owned? predicates cannot port"
status: draft
updated: 2026-08-17
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages:
  - "ruby-compat"
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Refinement (2026-10-22)

Re-verified against trails `origin/main` when 0023 was retired. adapters moved to ruby-compat; still no process uid; owned? unported. Where this note and the original text below disagree, the note is current; the acceptance criteria apply to what remains.

## Context

Ruby's `File::Stat#owned?` is `stat.uid == Process.uid`. No trails adapter
exposes the running process's uid: `ProcessAdapter`
(`packages/activesupport/src/process-adapter.ts:32-45`) carries `cwd`, `chdir`,
`platform`, `setEnv`, `exit`, `onSignal` and the three streams, and `OsAdapter`
(`packages/activesupport/src/os-adapter.ts:9-25`) carries `tmpdir`, `platform`,
`cwd`, `availableParallelism`. `FsStatResult.uid`
(`packages/activesupport/src/fs-adapter.ts:15`) is the only uid in the codebase,
and it is the _file's_ owner, never the process's.

Two sites already work around the gap:

- `packages/activesupport/src/core-ext/file/atomic.ts:57` reads `oldStat.uid` off
  a stat and chowns from it, rather than comparing against the process uid.
- `packages/activesupport/src/encrypted-file.test.ts` (PR #6641) ports
  `assert_predicate file, :owned?` (`vendor/rails/v8.0.2/activesupport/test/encrypted_file_test.rb:58`)
  by comparing the content file's uid to the _tmpdir's_ uid, since the tmpdir was
  created by the same process in `beforeEach`. Equivalent within that test's own
  setup, but it asserts "same owner as the tmpdir" rather than Rails' "owner is
  the running process", and it cannot be reused anywhere the two could differ.

## Converged shape

Add the process uid to the adapter surface (`ProcessAdapter`, alongside the
other `process.*` shims it already fronts) so `owned?`-shaped predicates port as
Rails writes them, then convert both call sites above to compare against it.
Reviewer on PR #6641 flagged this as non-blocking precisely because the hook does
not exist yet.

## Acceptance criteria

- The running process's uid is reachable through an adapter, with no `process.*`
  reference outside the Node adapter registration.
- `encrypted-file.test.ts`'s "change sets restricted permissions" asserts
  `stat.uid === <process uid>`, dropping the tmpdir substitution and its comment.
- `core-ext/file/atomic.ts:57` uses it where Ruby consults `Process.uid`.
- `encrypted_file_test.rb` stays at 0 assertion mismatches.
