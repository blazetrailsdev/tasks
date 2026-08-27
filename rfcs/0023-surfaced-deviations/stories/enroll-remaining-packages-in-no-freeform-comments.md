---
title: "Enrol the remaining packages in no-freeform-comments and sweep them"
status: draft
updated: 2026-08-27
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 700
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #7132 changed `blazetrails/no-freeform-comments` to the maintainer's
2026-08-27 policy — trails carries no English-language comments; only the
repo's JSDoc flags reduced to their data, plus tool directives — and swept
every tree the rule was enrolled on (arel, activemodel, and the enrolled
activerecord trees).

**The enrollment set is where the policy stops.** These packages have no
`no-freeform-comments` entry in `eslint.config.mjs` at all, so the policy does
not reach them and the prose keeps accruing. Comment lines measured on
`origin/main` at 9415a63a9:

| package          | comment lines |
| ---------------- | ------------: |
| activesupport    |        13,131 |
| actionpack       |         9,113 |
| date             |         5,246 |
| trailties        |         2,180 |
| i18n             |         1,461 |
| actionview       |         1,440 |
| activerecord-cli |           696 |
| globalid         |           582 |
| rack             |           493 |
| trails-tsc       |           332 |
| html-sanitizer   |           177 |
| tse-compiler     |            89 |
| nokogiri         |            10 |

Enrollment is **only-grow** by construction, and the sweep is the rule's own
`--fix` output, so each package is: add its glob to the
`no-freeform-comments` block in `eslint.config.mjs`, run `pnpm lint --fix`,
read the diff.

## Sequencing

One package per PR, largest last. `activesupport` and `actionpack` alone are
each far past any PR ceiling and want splitting by subtree the way
`packages/activerecord/src/a*.ts` was.

**Before sweeping a package, check what reads its comments.** PR #7132 found
four separate directive classes the hard way — a deleted `drift-ok:` waiver
(`scripts/mixin-declaration-drift.ts`'s `WAIVER`) red every AR lane while
reporting a _type_ mismatch, and 17 `eslint-disable` blocks were destroyed by
an earlier rule bug. The current keep-set is `@internal`,
`@noRailsEquivalent`, `@missingRailsCall`, `@missingRailsArgs`, `@deprecated`,
`@empty`, `boundary:` / `@boundary-file:`, `@nie disposition=`, `drift-ok:`,
and the standard `eslint-*` / `@ts-*` / `prettier-ignore` / coverage pragmas.
A package with its own tooling may add to it.

## Acceptance criteria

- [ ] Each enrolled package's glob is added to the `no-freeform-comments`
      block in `eslint.config.mjs`, never removed to turn a run green.
- [ ] The sweep is the rule's `--fix` output, not hand edits.
- [ ] No tool directive is deleted or rewritten, and no machine-read tag loses
      an argument an extractor reads.
- [ ] `pnpm parity:api`, `parity:api:calls`, `parity:api:calls:args` and
      `parity:api:extra:gate` pass with no baseline row added or removed.
- [ ] `pnpm lint` clean; no new eslint-disable.
