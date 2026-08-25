---
title: "Disposition the 8 in-closure activesupport files that have no TS counterpart at all"
status: done
updated: 2026-08-15
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6559
claim: "2026-08-15T01:45:06Z"
assignee: "burn-down-result-empty-async-call-rows"
blocked-by: null
closed-reason: null
---

# Disposition the 8 in-closure activesupport files that have no TS counterpart at all

## Context

Measured 2026-08-14 (full `pnpm build` + `pnpm parity:api`, filtered through
`scripts/api-compare/output/ar-closure.json`). Eight files are **inside the AR
closure**, so they count against RFC 0098's "Done means", yet report
`tsFileExists: false` — no TS file at the expected path, 39 members missing
outright:

| Rails file                           | Expected TS path                    | Missing |
| ------------------------------------ | ----------------------------------- | ------: |
| `concurrency/share_lock.rb` (225 ln) | `concurrency/share-lock.ts`         |      13 |
| `testing/parallelization/server.rb`  | `testing/parallelization/server.ts` |       8 |
| `testing/parallelization/worker.rb`  | `testing/parallelization/worker.ts` |       8 |
| `core_ext/date_time/acts_like.rb`    | `core-ext/date-time/acts-like.ts`   |       4 |
| `core_ext/numeric/conversions.rb`    | `core-ext/numeric/conversions.ts`   |       2 |
| `multibyte.rb`                       | `multibyte.ts`                      |       2 |
| `core_ext/date/acts_like.rb`         | `core-ext/date/acts-like.ts`        |       1 |
| `core_ext/module/aliasing.rb`        | `core-ext/module/aliasing.ts`       |       1 |

This is a **triage** story, not a port-everything story. These almost certainly
do not all deserve the same answer, and the current state — silently absent —
is the one answer that is definitely wrong, because it reads identically to
"not looked at yet".

Likely dispositions, to be confirmed against the source rather than assumed:

- `share_lock.rb` — a Ruby `Monitor`/`ConditionVariable` reader-writer lock for
  preemptive threads. JS has no preemption; this is the strongest
  `SKIP_GROUPS` candidate in the list, but the reason must be written down
  once, at the group, not re-derived per member.
- `testing/parallelization/{server,worker}.rb` — process-forking parallel test
  execution. vitest owns the run in trails, which is the same reasoning that
  closed the minitest reporter stories (2026-08-14). Probably a skip with that
  citation.
- `core_ext/{date,date_time}/acts_like.rb`, `core_ext/numeric/conversions.rb`,
  `core_ext/module/aliasing.rb` — small, ordinary core-ext ports with no
  language obstacle. `Module#alias_attribute` in particular is live surface
  that ActiveModel/ActiveRecord already re-implement, so check whether the port
  belongs here and the AR copies should delegate.
- `multibyte.rb` — `proxy_class`/`proxy_class=` only; check whether trails has a
  Multibyte concept at all before porting an accessor for a class that does not
  exist.

Note some of these expected paths may be mis-derived rather than genuinely
unported — verify against `docs/ruby-ts-conventions.md` and
`RUBY_FILE_TS_OVERRIDES` before concluding a file is missing. `acts_like?`
members may already live in `time-ext.ts` alongside their siblings
(`core_ext/time/acts_like.rb` resolves there and reports only 1 missing), in
which case the fix is a path override, not a port.

## Acceptance criteria

- [ ] Every one of the 8 files has a recorded disposition: **ported**,
      **`SKIP_GROUPS` with a reason**, or **path-override corrected** (the file
      was already ported elsewhere and the expected path was wrong).
- [ ] No file is left in the current silent state — absent with no register
      entry.
- [ ] Ports that are genuinely small and unobstructed (`acts_like` pair,
      `numeric/conversions`, `module/aliasing`) land in this story or are filed
      as named follow-ups; they are not swept into a skip group for
      convenience.
- [ ] `pnpm parity:api` in-closure activesupport count reflects the outcome,
      and the RFC's remaining gap is restated in the PR body from the new
      measurement.

## Notes

Triage first, then split. Expect this to produce 2–4 follow-up port stories;
file them with `pnpm tasks new` rather than growing this PR.
