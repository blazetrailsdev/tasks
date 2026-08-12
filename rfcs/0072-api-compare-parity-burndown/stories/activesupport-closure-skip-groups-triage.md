---
title: "SKIP_GROUPS triage for non-portable AS members inside the AR/AM closure"
status: done
updated: 2026-08-12
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6410
claim: "2026-08-12T12:46:03Z"
assignee: "activesupport-closure-skip-groups-triage"
blocked-by: null
closed-reason: null
---

## Context

Audit `activesupport-ar-gaps-20260810T143915Z.md`, Gap 4 / Slot I: inside the AR/AM require closure, ~70 missing activesupport members are Ruby-runtime machinery with no TS equivalent and belong in `SKIP_GROUPS` (`scripts/parity/conventions.ts`) with reasons, not ports:

- `ActiveSupport::Dependencies` (`dependencies.rb`, 18 members: `interlock`, `run_interlock`, `load_interlock`, `autoload_paths`, `_eager_load_paths`, …) + `dependencies/autoload.rb` (5) — Zeitwerk/autoload machinery; ESM has no code reloading, trails uses the zero-import-slot pattern instead (CLAUDE.md "Call-time constant resolution").
- `ActiveSupport::Multibyte::Chars` encoding internals (`multibyte/chars.rb`, 20: `wrapped_string`, `to_str`, `slice!`, …) — JS strings are UTF-16 natively; AR requires mb_chars only through Inflector. Keep any member Inflector tests actually exercise; skip the rest.
- `testing/parallelization.rb` (7) — process-fork test parallelism; vitest owns this.
- `test_case.rb` minitest plumbing subset (46 members total; triage which are minitest lifecycle vs portable assertions — port the assertion-adjacent ones, skip the runner plumbing).
- `concurrency/load_interlock_aware_monitor.rb` (5) — check RFC 0073 (permanent connection checkout) before deciding; the pool convergence may make it portable.

Each skip needs a per-group reason in conventions.ts; run `pnpm parity:api:conventions` to regenerate docs/ruby-ts-conventions.md. This is triage: any member that turns out portable gets a port story instead of a skip row — do not skip to move a number.

## Acceptance criteria

- SKIP_GROUPS entries with reasons for the confirmed non-portable groups; no portable member skipped.
- `pnpm parity:api` delta non-negative; docs regenerated, not hand-edited.
- A short list in the PR body of members deliberately NOT skipped (deferred to port stories) with the reason.
