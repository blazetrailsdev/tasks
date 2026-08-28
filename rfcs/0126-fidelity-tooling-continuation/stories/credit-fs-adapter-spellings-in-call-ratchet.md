---
title: "Credit the fs-adapter's Node spellings as the File.exist?/stat/rename calls"
status: ready
updated: 2026-08-28
rfc: "0126-fidelity-tooling-continuation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `File` class methods have no Ruby-named counterpart in trails: the port
calls the fs adapter, whose members carry Node's spellings (`existsSync`,
`statSync`, `renameSync`, `unlinkSync`, `realpathSync`). The call ratchet
matches on the Ruby call NAME, so every faithful port of a `File.exist?` /
`File.stat` / `File.rename` / `File.unlink` call is flagged as an omission and
has to be bought off with a baseline row.

Rows paying for exactly this today:

- `scripts/api-compare/call-mismatches-exclude/activesupport/core-ext/file/atomic.json`
  — 4 rows (`atomic_write` × `exist?`/`stat`/`rename`, `probe_stat_in` × `stat`),
  added by PR #6447 for `activesupport/lib/active_support/core_ext/file/atomic.rb:28`,
  `:30`, `:48`, `:66`.
- `.../activesupport/cache/file-store.json` — several `exist?` rows carrying the
  same hand-written reason string.
- `.../activesupport/encrypted-file.json` — two more `exist?` rows.

The reason text is already copy-pasted verbatim across three files, which is the
signal that this is one comparator gap, not N per-file judgement calls.

## Converged shape

Credit the fs-adapter spelling as making the Ruby `File` call, the same way
`JS_ENUMERABLE_ALIASES` (`scripts/api-compare/enumerable-idioms.ts:30`) already
credits `some` for `any?`. That table's charter is Enumerable/Comparable, so
this wants its own sibling table (an `FS_ADAPTER_ALIASES`, or a general
"differently-spelled analogue" map the two feed into), mapping at least:

    exist? -> existsSync/exists,  stat -> statSync/stat,
    rename -> renameSync/rename,  unlink -> unlinkSync/unlink,
    realpath -> realpathSync/realpath

Per that file's own rule, an alias only decides whether a TS body already makes
a call and can never introduce a new mismatch, so adding these is safe.

Then delete the baseline rows the aliases make stale (only-shrink: delete by
hand, do not reseed).

## Acceptance criteria

- [ ] The fs-adapter spellings are credited by the call ratchet.
- [ ] The 4 `core-ext/file/atomic.json` rows are deleted.
- [ ] The `exist?` rows in `cache/file-store.json` and `encrypted-file.json`
      carrying the "fs-adapter's existsSync is the File.exist? analogue" reason
      are deleted.
- [ ] `pnpm parity:api:calls` is green with a strictly smaller baseline row count.

## Re-verified 2026-08-17 (draft sweep)

Still valid, verbatim. `call-mismatches-exclude/activesupport/core-ext/file/atomic.json`
still carries exactly **4 rows**.
