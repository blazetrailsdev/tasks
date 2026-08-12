---
title: "Triage the missing members on partially-ported out-of-closure activesupport files"
status: done
updated: 2026-08-12
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 240
priority: null
pr: 6415
claim: "2026-08-12T14:36:51Z"
assignee: "converge-remaining-marked-for-destruction-slot-reads"
blocked-by: null
closed-reason: null
---

## Context

PR #6411 declared the out-of-closure activesupport families with NO trails
counterpart as `UNPORTED_FILES`. It deliberately left the out-of-closure files
that ARE partially ported counted, because excluding them would have forfeited
real matched credit. Those files now carry the whole remaining out-of-closure
denominator and have never been triaged member by member:

| Ruby file (activesupport) | matched | missing |
| ------------------------- | ------- | ------- |
| `cache.rb`                | 51      | 12      |
| `cache/file_store.rb`     | 12      | 8       |
| `cache/memory_store.rb`   | 13      | 7       |
| `cache/null_store.rb`     | 8       | 3       |
| `xml_mini.rb`             | 4       | 15      |
| `xml_mini/nokogirisax.rb` | 1       | 10      |

(from `scripts/api-compare/output/api-comparison.json` at main 7061b019e; the
require-closure walk is `scripts/api-compare/ar-closure.ts`, and none of these
files is in the AR/AM closure it derives.)

Each missing member is one of three things and needs to be sorted into them:

- a real gap in an otherwise-live trails port (port it),
- Ruby-only surface with no JS spelling (a reasoned `SKIP_GROUPS` row in
  `scripts/parity/conventions.ts`, per the audit's Slot I), or
- out-of-scope-for-now surface on a file we only half-ported (which is a
  scope question, not a `pattern` exclusion — the file has a port, so
  `UNPORTED_FILES` is the wrong register).

## Acceptance criteria

- Every one of the ~55 missing members above is classified port / SKIP_GROUPS /
  deferred-with-reason, with the Rails `file:line` recorded.
- SKIP_GROUPS rows land with reasons in `scripts/parity/conventions.ts`; ports
  that are small enough land in this story, larger ones are filed as their own
  stories.
- No `UNPORTED_FILES` entry is added for a file that has a trails port.
- `pnpm parity:api` delta non-negative; the activesupport totals change is
  stated in the PR body (the stats DB reads `percent`).
