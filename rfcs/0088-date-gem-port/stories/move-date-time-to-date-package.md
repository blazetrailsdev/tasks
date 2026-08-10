---
title: "move-date-time-to-date-package"
status: done
updated: 2026-08-06
rfc: "0088-date-gem-port"
cluster: null
deps: ["date-package-scaffold"]
deps-rfc: []
est-loc: 350
pr: 6144
claim: "2026-08-05T21:13:08Z"
assignee: "move-date-time-to-date-package"
blocked-by: null
closed-reason: null
---

## Context

Moves `packages/i18n/src/date.ts` (2,554 lines) and `time.ts` (288) to
`packages/date/src/`. **Mechanical move, no behavior change** — note it in the
PR body per the CLAUDE.md single-mechanical-rename exception.

These files are not i18n. `vendor/i18n/lib/i18n/` ships no date implementation,
and i18n's own `localize` never names the `Date` class:
`packages/i18n/src/backend/base.ts:358` duck-types its argument on
`strftime`/`wday`/`mon`/`hour`/`sec` (`base.ts:248-256`), exactly as the gem
does. So i18n → date is structural, not circular, and `packages/date` does not depend
on i18n and cannot come to.

**The blast radius is one import.** The only cross-package consumer of
`@blazetrails/i18n/date` in the repo is
`packages/activesupport/src/i18n.test.ts:5`. Nothing in production imports it.
That is why this move is cheap now and gets more expensive with every new caller.

`packages/i18n/package.json` currently exposes `./date` and `./time` subpath
exports; both go away.

## Acceptance criteria

- [ ] `date.ts`, `time.ts`, `date.trails.test.ts`, `time.trails.test.ts` moved to
      `packages/date/src/`, imports rewritten.
- [ ] `./date` and `./time` subpath exports removed from
      `packages/i18n/package.json`; `packages/i18n` no longer depends on them.
- [ ] `packages/activesupport/src/i18n.test.ts:5` imports from
      `@blazetrails/date` — the sole consumer update.
- [ ] `time.ts`'s import of `ArgumentError`/`strftime` from `./date.js` still
      resolves intra-package.
- [ ] **Zero behavior change** — no method body edited, no test renamed. Test
      names are the `parity:test` matching key.
- [ ] `pnpm typecheck` green; the moved tests pass.
