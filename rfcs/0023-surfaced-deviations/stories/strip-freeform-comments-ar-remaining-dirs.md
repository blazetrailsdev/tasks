---
title: "Enrol ALL of activerecord in no-freeform-comments and sweep it in one PR"
status: in-progress
updated: 2026-08-29
rfc: "0023-surfaced-deviations"
cluster: null
packages:
  - "activerecord"
deps:
  - "no-freeform-comments-repo-wide-and-drop-cites-gate"
deps-rfc: []
est-loc: 9000
priority: null
pr: 7195
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

**Scope changed 2026-08-28 (maintainer).** This story was the last of six
incremental slices of `strip-freeform-comments-activerecord`, each shipping a
directory or two under the standard LOC ceiling. That is no longer the plan.
This story now enrols **the whole of `packages/activerecord/src/**`** in
`blazetrails/no-freeform-comments` and sweeps it in **one PR**, with **no LOC
ceiling** — a very large PR is the expected and accepted shape here.

The reason for the change: the incremental shape is what has been leaking. The
rule is enrolled by an allowlist, so every directory not yet swept has a
permanent free pass, and new prose keeps landing in the unenrolled ones faster
than the slices retire it. Slicing also means the collapse to a single glob
never arrives. One PR, one enrolment, done.

### Depends on the mechanism flip

`no-freeform-comments-repo-wide-and-drop-cites-gate` (RFC 0127) inverts the
rule's configuration: repo-wide `error`, with a shrinking **exclusion** list of
unswept trees replacing today's enrolment allowlist in
`eslint.config.mjs:818-863`. **Land that first.** This story's edit then becomes
"delete every `packages/activerecord/**` row from the exclusion list", not
"add globs to a `files` list". If for any reason that PR has not landed when
this one starts, do the equivalent under whichever shape is on `main` — the
deliverable is that no activerecord path is exempt from the rule by the end,
however the config expresses it.

### Measured scope (2026-08-28, `main` @ 9c3c95d82)

Running the rule in `report` mode over `packages/activerecord/src/**/*.ts`:
**1058 files with violations, 9098 violations.** By directory:

| violations | dir                       |
| ---------- | ------------------------- |
| 5355       | `(root)`                  |
| 997        | `associations`            |
| 612        | `test-helpers`            |
| 444        | `encryption`              |
| 261        | `connection-adapters`     |
| 209        | `type-virtualization`     |
| 191        | `tasks`                   |
| 187        | `attribute-methods`       |
| 145        | `validations`             |
| 126        | `migration`               |
| 101        | `scoping`                 |
| 84         | `sqlite`                  |
| 78         | `database-configurations` |
| 72         | `type`                    |
| 62         | `test-fixtures`           |
| 36         | `cases`                   |
| 35         | `coders`                  |
| 30         | `locking`                 |
| 28         | `testing`                 |
| 17         | `middleware`              |
| 12         | `trailties`               |
| 9          | `type-caster`             |
| 3          | `locale`                  |
| 2          | `assertions`              |
| 2          | `persistence`             |

Heaviest single files: `base.ts` 430, `relation.ts` 299, `migration.ts` 182,
`associations/has-many-associations.test.ts` 144, `persistence.ts` 137,
`migration.test.ts` 124, `querying.ts` 124, `fixtures.ts` 100,
`schema-dumper.ts` 95, `reflection.ts` 93, `core.ts` 90.

`(root)` dominates because only `packages/activerecord/src/a*.ts` is enrolled
there today. **4439 of the 9098 are in `*.test.ts` files**, which the current
config `ignores` outright — test files are in scope for this story, not
deferred again.

Reproduce with:

```sh
npx eslint --no-warn-ignored \
  --rule '{"blazetrails/no-freeform-comments":["warn",{"report":true}]}' \
  'packages/activerecord/src/**/*.ts'
```

### The bar

Per the 2026-08-27 maintainer policy in `eslint/no-freeform-comments.mjs`'s
header: a comment that restates the line or branch it sits on goes, whatever
its subject. **Rails' own comments are deleted too** — the Ruby is vendored.

Note this story's previous wording said surviving comments keep "a Rails
citation". **That is out of date and must not be followed.** The same policy
deleted citations: a `Mirrors:` line, a bare `.rb:LINE` reference and a Ruby
constant path all go, because a line number is wrong the moment Rails edits the
file above it and `pnpm rails:find <query>` recovers it on demand. The only
things that survive are what the rule itself keeps: the repo's own JSDoc flags
(`@internal`, `@noRailsEquivalent`, `@missingRailsCall`, `@missingRailsArgs`)
with their permanence token, `@empty`, `@deprecated`, and tool directives
(`eslint-*`, `@ts-*`, `prettier-ignore`, `boundary:`, `@nie disposition=`,
`drift-ok:`).

A comment recording deferred work becomes a story — file it with
`pnpm tasks new <rfc> <slug> --body-file <path>` carrying the trails/Rails
`file:line` you have in front of you, and do NOT let filing them balloon into
a second sweep.

## Acceptance criteria

- [ ] No `packages/activerecord/**` path is exempt from
      `blazetrails/no-freeform-comments`: every activerecord row is deleted from
      the exclusion list (or, under the pre-flip shape, the enrolment globs are
      collapsed to `packages/activerecord/src/**/*.ts`). `*.test.ts` files are
      included — no `ignores` row survives for them.
- [ ] `npx eslint --no-warn-ignored 'packages/activerecord/src/**/*.ts'` reports
      **zero** `no-freeform-comments` violations.
- [ ] `pnpm eslint --fix` applied and the deletions **reviewed rather than taken
      on trust** — the autofix is destructive by design; read the diff and
      rescue anything load-bearing. A second `--fix` run is a no-op.
- [ ] No LOC ceiling applies. Do NOT split this into sibling PRs, and do NOT
      leave a directory behind to keep the diff smaller.
- [ ] `pnpm typecheck` clean. Run the test files you touched; do NOT run the
      full AR suite locally — CI covers it.
- [ ] No baseline, allowlist, mark, or `@noRailsEquivalent`/`@missingRailsCall`
      receipt is added or widened to absorb a deletion. If deleting a comment
      would strip a receipt's reason, keep the tag and its permanence token —
      that is machine input, not prose.
- [ ] Any deferred work or known deviation found in a deleted comment is filed
      as its own story with the trails/Rails `file:line`.
