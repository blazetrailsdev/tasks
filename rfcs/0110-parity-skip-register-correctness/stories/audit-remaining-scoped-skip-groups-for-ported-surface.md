---
title: "Audit the remaining SCOPED_SKIP_GROUPS entries for ported surface and stale reasons"
status: draft
updated: 2026-08-18
rfc: "0110-parity-skip-register-correctness"
cluster: null
packages: ["activerecord", "activesupport"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`SCOPED_SKIP_GROUPS` grew 18 names / 9 groups → 164 names / 30 groups between
2026-08-10 and 2026-08-17 (measured at each day's last first-parent commit on
`main` via `git show <sha>:scripts/parity/conventions.ts`). No counter, ratchet
or high-water mark reads the register, so the growth was unobserved.

A partial read — roughly 8 of the 30 groups — found 4 groups (~11 names) that
suppress surface trails has already ported, and one entry
(`build_count_subquery`) whose reason is factually wrong about the current
tree. Those are handled by the sibling stories. **The remaining ~22 groups have
not been read**, and at that hit rate they should not be assumed clean.

Entries already confirmed genuine and out of scope: `gc_time`/`allocations`
(no JS GC counters), `squish!`/`remove!` (immutable JS primitive),
`marshal_dump`/`marshal_load`, the Zeitwerk `autoload`/`Dependencies` family,
`alias_attribute`/`concerning` (needs `module_eval` + constant assignment),
the Monitor / ShareLock / Parallelization threading cluster, `+@`/`-@`,
`messages/rotator.rb` `initialize` (correct `tsMirrorName` use).

## Acceptance criteria

1. Every `SCOPED_SKIP_GROUPS` entry not covered by a sibling story is read
   against the vendored Ruby and the trails tree, and classified as exactly one
   of: (a) genuine language shortcoming, (b) ported surface that should be
   credited, (c) stale reason, (d) duplicate of debt tracked elsewhere.
2. The classification lands as a table in the RFC README, one row per group,
   with the trails `file:line` checked for each (b)/(c).
3. Every (b) and (c) is either fixed in this PR when it is a one-line entry
   deletion, or filed as its own story with the `file:line` already in the
   body. Do not leave a finding recorded only in the table.
4. Every surviving entry's reason is accurate as of this PR — a reason that
   describes a tree state that no longer holds is a (c), not a wording nit.
5. The PR states the `parity:api` delta.

## Notes

Scope control: this is a read-and-classify story. If the (b)/(c) population
turns out large, file the fixes and keep this PR to the classification plus the
one-line deletions — do not let it grow past the LOC ceiling.
