---
title: "Burn down the last 5 finder-methods.ts call rows: find_with_ids, find_one, raise_record_not_found_exception!"
status: done
updated: 2026-08-16
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6589
claim: "2026-08-16T01:15:07Z"
assignee: "finder-methods-residue-find-with-ids-find-one-raise"
blocked-by: null
closed-reason: null
---

## Context

PR #6584 (RFC 0106 wave 2) took `packages/activerecord/src/relation/finder-methods.ts`
from 19 `kind: "set"` rows to 11 and hit the PR's scope there. Of the 11 left,
**6 are genuine Ruby-Array idioms** already verified per-site (`find_take`/
`find_nth` → `Array#first`, `find_last` → `Array#last`, `find_take_with_limit`
→ `Array#take`, and the two `empty?` rows) and are not burndown work.

The other **5 were simply not attempted** and are this story:

| Ruby method                         | Missing call                               | Rails                                                                                                 |
| ----------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `raise_record_not_found_exception!` | `wrap`                                     | `finder_methods.rb:411-427` — `Array.wrap(ids)`                                                       |
| `raise_record_not_found_exception!` | `size`                                     | same                                                                                                  |
| `find_with_ids`                     | `first`                                    | `finder_methods.rb:504-524`                                                                           |
| `find_with_ids`                     | call order (`find_one` before `find_some`) | same — Ruby's `case ids.size` reaches `find_one` in the `when 1` arm before `find_some` in the `else` |
| `find_one`                          | `where`                                    | `finder_methods.rb:530-541`                                                                           |

Each needs the Ruby body read and the TS body made to call what Rails calls;
the `find_with_ids` order row in particular is a control-flow ordering
difference, not a missing call, so check the branch structure rather than
adding a call.

## Acceptance criteria

- [ ] Every row converged is converged because the TS body now makes the call
      Rails makes, verified against the Ruby body.
- [ ] Rows that cannot converge carry a reviewed one-line reason or a
      `@missingRailsCall` tag at the call site.
- [ ] Rows deleted by hand from
      `scripts/api-compare/call-mismatches-exclude/activerecord/relation/finder-methods.json`;
      stale mark fixed with
      `pnpm parity:api:calls:tighten activerecord/relation/finder-methods.json`.
      No `--write`, no reseed.
- [ ] `pnpm parity:api:calls` green; in-scope count falls and does not rise.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
