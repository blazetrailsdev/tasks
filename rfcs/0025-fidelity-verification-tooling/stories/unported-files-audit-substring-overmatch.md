---
title: "Audit UNPORTED_FILES bare-filename entries that substring-match and hide ported files"
status: ready
updated: 2026-07-15
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follow-up to `unported-files-binary-test-false-marshal-exclusion` (closed by
PR #4891). That story fixed one bad entry; its last acceptance criterion — auditing
whether **other** entries over-match the same way — was not done and is carried
here.

`UNPORTED_FILES` entries keyed by a bare filename (`testFile: "foo_test.rb"`, no
leading `/`) are matched by **plain substring** in `isTestFileUnported`
(`scripts/api-compare/unported-files.ts:967-978`), and `test-compare.ts:477` does
`continue` on a match — the whole file disappears from test:compare accounting.
The leading-`/` anchor exists precisely to prevent this, but is optional and
easy to omit.

Demonstrated concretely by the entry #4891 removed: `testFile: "binary_test.rb"`
silently excluded **three** files —
`activerecord/test/cases/binary_test.rb`,
`activemodel/test/cases/type/binary_test.rb` and
`activerecord/test/cases/arel/nodes/binary_test.rb`. The latter two were fully
ported and had been getting zero credit. Its stated reason ("Tests Marshal/YAML
binary encoding of AR records") was also false — no `binary_test.rb` in Rails
contains Marshal or YAML (`grep -c "Marshal\|YAML"` → 0 for all three). Fixing
that one entry was net-positive everywhere:

```text
arel          701/705   -> 703/707    (58 -> 59 files)
activerecord  7640/7812 -> 7642/7815  (315 -> 316 files)
activemodel   952/956   -> 954/958    (54 -> 55 files)
```

The tell for this class of bug: port and un-skip a real Rails test and the
test:compare line does not move **at all** — meaning the file is excluded, not
that the port failed.

## Acceptance criteria

- [ ] Enumerate every `UNPORTED_FILES` entry whose `testFile` lacks a leading `/`
      and resolve how many vendored Rails files each actually matches (a script
      over `vendor/rails` is fine; it is a mechanical check).
- [ ] For each entry matching more than the file it was written for, anchor or
      path-qualify it (e.g. `cases/foo_test.rb`) so unrelated files re-enter
      accounting.
- [ ] Spot-check each surviving whole-file entry's `reason` against the actual
      source — the binary_test.rb reason was fabricated, so others may be too.
      Prefer per-test `tests: [...]` exclusion where only some cases are Ruby-only
      (`isTestFileUnported` returns false when `e.tests` is set, keeping the file
      counted).
- [ ] Report the test:compare delta per package. Newly-visible unported tests
      showing as skipped/unmatched is an acceptable accounting correction — state
      which appear and why.
- [ ] Consider making the anchor mandatory (or warning on a bare filename that
      resolves to >1 file) so this cannot recur silently.
