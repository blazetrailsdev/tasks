---
title: "File and Dir leave CORE_CLASS_RECEIVERS — the story that turns the gate on, with nothing left for it to catch"
status: done
updated: 2026-09-03
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: ["ruby-compat"]
deps:
  [
    "flip-file-dir-call-sites-activesupport",
    "flip-file-dir-call-sites-activerecord",
    "flip-file-dir-call-sites-actionpack-and-actionview",
    "flip-file-dir-call-sites-trailties",
    "flip-file-dir-call-sites-rack",
  ]
deps-rfc: []
est-loc: 150
priority: 11
pr: 7462
claim: "2026-09-03T22:18:08Z"
assignee: "unexempt-file-and-dir-from-core-class-receivers"
blocked-by: null
closed-reason: null
---

## Context

The story that turns the gate on. Every `File.*` and `Dir.*` call site has been
flipped by the five `flip-file-dir-call-sites-*` links, so removing the two
receivers from the exemption should catch nothing — and if it catches something,
that is a real divergence the flips missed, which is the whole point.

`scripts/api-compare/extract-ruby-api.rb:3008-3011` drops every call on
`File Dir IO Module Class Proc Kernel Marshal ObjectSpace GC Process Thread
Mutex Encoding Random Signal Struct Method` from the Ruby call-set before the
gate compares. PR #6680 (`8a2145ceb`) added it and deleted 74 baseline rows as
stale, reasoning that a call to `File.exist?` is Ruby rather than a ported
collaborator and no TS body could be expected to make it. That reasoning expires
once `File.isExist` is a callable trails member — which it now is.

`File` is 1415 Rails calls and `Dir` 306, workspace-wide; the gate population is
the ported-body subset and is smaller. Measure it before starting with
`API_COMPARE_FORCE=1 pnpm parity:api --calls` against a scratch build that has
the two receivers removed, and state the number in the PR body — that number is
the evidence the flip chain actually finished.

`CORE_CLASS_RECEIVERS` is **only-shrink** from here. A receiver leaves when
ruby-compat can spell it; nothing is ever added back to quiet a red run, and the
remaining fourteen (`Class`, `Thread`, `Struct`, `Proc`, `Marshal`, `Module`,
`Encoding`, `Mutex`, `Kernel`, `GC`, `ObjectSpace`, `Method`, `Random`,
`Signal` — 1834 Rails calls combined) each retire with their own port.

## Acceptance criteria

- `File` and `Dir` are gone from `CORE_CLASS_RECEIVERS`, and a comment there
  records that the list is an only-shrink burndown of receivers trails cannot
  yet spell, not a permanent rule.
- `pnpm parity:api:calls` and `pnpm parity:api:calls:args` are green with them
  gone. Any residue is converged, not baselined — a new baseline row here is an
  admission the flip chain is unfinished.
- `getFs()` and `getPath()` are deleted from ruby-compat's public exports; the
  `FsAdapter` / `PathAdapter` / `FsStatResult` / `FsDirent` types stay, for
  backends.
- The PR body states the measured ported-body row count before and after.
