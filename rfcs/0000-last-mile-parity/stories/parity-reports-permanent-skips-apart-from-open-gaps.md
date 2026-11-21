---
title: "parity: report permanent skips apart from open gaps on both parity:test and the website"
status: draft
updated: 2026-11-20
rfc: "0000-last-mile-parity"
cluster: measurement
packages: [scripts, website]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/test-compare/compare.ts:1417` scores `matched - matchedSkipped`, so a
`PERMANENT-SKIP` counts as an open gap in the `parity:test` headline.
`scripts/parity/package-summary.ts:456` writes `testsMatched: t.matched`, which
counts every skip, `BLOCKED:` included, as matched. actioncable's
`channel/base.rb` reads 23/23 on the site and 21/23 in CI.

A test is permanent when it is `it.skip` under a `PERMANENT-SKIP:` line citing a
CLAUDE.md section or operator ruling, or a per-test `tests:` row in
`scripts/parity/unported-files/`. An upstream empty or skipped test (fugit
`@reboot`, `vendor/fugit/v1.11.1/spec/cron_spec.rb:1118`; mail
`vendor/mail/2.8.1/spec/mail/encodings_spec.rb:531`) is permanent under
`PERMANENT-SKIP: upstream`.

## Acceptance criteria

- [ ] `parity:test` prints `implemented / portable (P permanent)` with the percent over `portable = total - permanent`.
- [ ] `package-summary.json` `FileRow` gains `testsPermanent`; `testsMatched` excludes every non-permanent skip.
- [ ] The website shows the permanent count beside each ratio, linked to `permanentSkips`.
- [ ] `PERMANENT-SKIP: upstream` is recognised and applied to the fugit and mail tests above.
- [ ] Unit tests in `scripts/test-compare/` and `scripts/parity/` cover a permanent skip, a `BLOCKED:` skip and an unported `tests:` row.
- [ ] The activesupport time-travel subclass skip, which cites the closed
      `date-time-now-and-date-today-allocate-receiver-subclass`, is retargeted to
      `BLOCKED: time-date-class-methods-allocate-receiver-subclass`.

## Verification

```sh
pnpm vitest run scripts/test-compare scripts/parity && pnpm parity:test
```
