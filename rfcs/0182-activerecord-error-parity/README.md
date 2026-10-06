---
rfc: "0182-activerecord-error-parity"
title: "activerecord error parity: Rails' error class, message and raise site — split from RFC 0174"
status: active
created: 2026-10-06
updated: 2026-10-06
owner: "@deanmarano"
packages:
  - "activerecord"
  - "ruby-compat"
clusters:
  - errors
related-rfcs:
  - "0174-activerecord-api-parity-100"
  - "0175-activerecord-test-parity-100"
  - "0178-activerecord-arms-parity-100"
  - "0180-activerecord-receipt-parity"
  - "0181-activerecord-member-placement"
  - "0183-activerecord-excluded-source-files"
  - "0127-fidelity-tooling-signals-and-hygiene"
  - "0156-parity-beyond-name-presence"
priority: 2
---

# RFC 0182 — activerecord error parity: Rails' error class, message and raise site

## Summary

CLAUDE.md asks for "same error class, same message string, same raise site". This RFC holds activerecord's
residue against that rule: the files `blazetrails/rails-error-parity` still grandfathers, the callback
invocations `blazetrails/rails-callback-invocations` still grandfathers, and the one-off raises found to
differ from Rails. It was split out of `0174-activerecord-api-parity-100` on 2026-10-06 with the 5 stories
of 0174's `errors` cluster plus 8 unclustered stories about a raise. **13 stories, 13 open, 3,060 est-loc.**
The destination of a story is decided by one question: **does its first acceptance criterion change what
is raised, with what message, or where?**

## Motivation

The five `errors` stories burn down two eslint exclude files. Each exclude entry is a whole file the rule
does not read, so a wrong error class in an excluded file is invisible to CI. Eight unclustered stories in
0174 are exactly that kind of bug, found by hand while porting something else. They belong beside the
burn-down: converging one is the same work as clearing its file from the exclude list, and several sit in
files the burn-down stories own.

### Baseline

Measured 2026-10-06 on trails `main` @ `53cf6a5875`. The 0174 column is that RFC's baseline of 2026-09-30.

| Axis                                                         | 0174 baseline | Now | Target | Where the residue lives                                                                                                         |
| ------------------------------------------------------------ | ------------- | --- | ------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `eslint/rails-error-parity-exclude.json`, activerecord files | 74            | 73  | 0      | root 19, `connection-adapters/` 18, `associations/` 6, `encryption/` 5, `relation/` 5, `tasks/` 4, `test-helpers/` 4, others 12 |
| `eslint/rails-callback-invocations-exclude.json`             | 5             | 5   | 0      | `callbacks.ts#createOrUpdate`, `core.ts#initWithAttributes`, three in `transactions.ts`                                         |
| one-off raise deviations with a story                        | —             | 8   | 0      | sqlite drivers 2, associations 3, migration 2, `insert-all.ts` 1                                                                |

The exclude file holds 93 entries in all; the other 20 are other packages'.

## Design

### Scope

**In:** a story that deletes an activerecord entry from `rails-error-parity-exclude.json` or
`rails-callback-invocations-exclude.json`, and a story whose first acceptance criterion changes an error's
class, its message string, its constructor arguments, its backtrace or cause, or the site that raises it.

### Where a story goes

This table is repeated in 0174 § "Split: RFCs 0180 to 0183".

| The story's first acceptance criterion                                                                                                   | File it in |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| moves a member into the file mirroring the `.rb` that defines it (`inlined-from`, `parity:api:moves`)                                    | RFC 0181   |
| changes an error class, message or raise site, or deletes an error-parity / callback-invocations exclude row                             | here       |
| ports or un-excludes a `.rb` listed in `scripts/parity/unported-files/`                                                                  | RFC 0183   |
| deletes a receipt in `packages/activerecord/src`; or a `CONVERGEABLE <story-id>` receipt names the story; or a receipt audit surfaced it | RFC 0180   |
| deletes a row of the arms, void-return or duck-type report                                                                               | RFC 0178   |
| changes a test file, test model, fixture or the test schema                                                                              | RFC 0175   |
| any other activerecord source-side axis                                                                                                  | RFC 0174   |

The rows are read top to bottom and the first match wins. So a story a receipt names goes to RFC 0181,
0182 or 0183 when its subject is theirs, and to RFC 0180 otherwise.

### Principles

These are 0174's, unchanged:

- **Converge, never ratify.** Each story deletes rows or receipts. None adds a baseline row, a receipt, a
  skip or an exclude entry.
- **Blocked, not ratified.** Where a story hits a gap CLAUDE.md does not ratify, it is `blocked` with the
  concrete blocker (§ "Blocked"), never re-worded into a PERMANENT receipt.
- **Measurement faults are fixed in the tool**, with a unit test, and the fault story is filed in the RFC
  that owns the tool (RFC 0127 for signals and ratchets; RFC 0179 is closed).
- **Each story is one PR**, `est-loc` ≤ 650. A leftover is filed here as its own story with the Rails
  `file:line`.
- **Rails' string, verbatim.** A message keeps Rails' snake_case method names and its Symbol colons
  (`:destroy_async`); a test asserts what the Rails test asserts.
- **ruby-compat's classes.** A bare-string `raise` is a `RuntimeError`; `raise Klass, msg, backtrace` goes
  through `excSetBacktrace` / `excSetupMessage`. A plain JS `Error` is the deviation.
- **A file leaves the exclude list whole.** A burn-down story fixes every raise the rule reports in a file
  and deletes the entry in the same PR.

### Ordering

- The four `activerecord-burn-rails-error-parity-exclude-*` stories wait on
  `retire-dead-error-parity-disables-and-stale-arm-throw-marks` (RFC 0127, draft), which removes the dead
  disables first so the burn-down sees the real residue.
- `activerecord-burn-rails-callback-invocations-exclude` waits on
  `converge-activerecord-dropped-block-arms-remainder` (RFC 0156).
- A one-off story whose file a burn-down story lists lands first, or is folded into the burn-down's PR and
  closed with that PR number. No `deps` edge records this; the burn-down re-reads its file list.

### Gating

- **`active` from birth**, for 0174's reason: `claimable()` surfaces a story only when its own RFC is
  `active`. The 7 `ready` stories here were claimable in 0174 and stay claimable.
- **Edges out of this RFC:** the two above, to RFC 0127 (draft, so those four stories wait on 0127's
  activation) and RFC 0156. There are no edges to another 0174-family RFC.
- **Edges into this RFC:** the 0174 close-out only. `activerecord-api-parity-100-close-out` named these
  stories one by one in `deps`. This split replaces those entries with one `deps-rfc` edge on
  `0182-activerecord-error-parity`, the whole-RFC case 0174 § "Gating" describes: the close-out waits until this RFC is
  closed, including stories filed here later. The edit is in the split's own diff, so nothing is owed
  after merge.

## Stories

| Story                                                                                 | est-loc | Cluster |
| ------------------------------------------------------------------------------------- | ------- | ------- |
| `activerecord-burn-rails-callback-invocations-exclude`                                | 250     | errors  |
| `activerecord-burn-rails-error-parity-exclude-associations-relation-encryption-tasks` | 600     | errors  |
| `activerecord-burn-rails-error-parity-exclude-connection-adapters`                    | 600     | errors  |
| `activerecord-burn-rails-error-parity-exclude-rest`                                   | 420     | errors  |
| `activerecord-burn-rails-error-parity-exclude-root`                                   | 600     | errors  |
| `association-errors-hand-roll-the-did-you-mean-formatter`                             | 30      | errors  |
| `association-type-mismatch-message-carries-object-ids`                                | 90      | errors  |
| `assume-migrated-upto-version-raises-runtime-error`                                   | 30      | errors  |
| `check-dependent-options-message-matches-rails`                                       | 30      | errors  |
| `execute-migration-in-transaction-drops-the-rescued-backtrace`                        | 50      | errors  |
| `expo-sqlite-driver-raises-sqlite3-gem-exception-classes`                             | 200     | errors  |
| `insert-all-unknown-attribute-error-takes-a-stand-in-record`                          | 40      | errors  |
| `sqlite3-new-client-rescues-cantopen-not-enoent`                                      | 120     | errors  |

## Blocked

None.

## Non-goals

- **Driver-level error translation shape.** `pg-translate-exception-respond-to-result` and its prerequisite
  are duck-type rows and stay in RFC 0178.
- **`parity:api:arms:throws`.** The gated `throw` arm axis is at 0 and is owned by RFCs 0127 and 0156.
- **Error parity in other packages.** The other 20 exclude entries belong to those packages' RFCs.
- **A close-out story.** 0174's close-out re-measures this axis with every other one and pins it at zero.
  A second close-out here would measure the same rows twice.

## Alternatives considered

The four splits of 2026-10-06 were cut together. RFC 0178 § "Alternatives considered" rejected each of
these seams on 2026-10-02, for reasons that no longer hold:

- **`receipts` was "three unrelated things under one label".** RFC 0179 has since taken the comparer-rule
  stories out, so what is left is audits, receipt convergences and audit findings.
- **`placement`, `skips` and `calls-args` had edges into the clusters.** They still do (§ "Gating"), but a
  `deps` edge resolves by slug across RFCs, and cutting all four seams at once leaves 7 open cross-RFC
  edges in total.
- **`errors` and `excluded-files` were "too small to earn an RFC".** Each now also takes the unclustered
  stories on its subject, and 0174 at 301 stories is the larger cost.

- **Move only the 5 clustered stories**: rejected. Five stories do not earn an RFC, and the eight one-off
  raise stories are the same rule applied by hand.
- **Name it for the lint rules only**: rejected. The rule is CLAUDE.md's; the two exclude files are how
  part of it is measured.

## Rollout

Status is from the DB as of 2026-10-06.

1. **One-off raise deviations.** 8 stories, 8 open, 590 est-loc. No dependencies; small.
   - Ready: `expo-sqlite-driver-raises-sqlite3-gem-exception-classes`, `sqlite3-new-client-rescues-cantopen-not-enoent`
   - Draft: `association-errors-hand-roll-the-did-you-mean-formatter`, `association-type-mismatch-message-carries-object-ids`, `assume-migrated-upto-version-raises-runtime-error`, `check-dependent-options-message-matches-rails`, `execute-migration-in-transaction-drops-the-rescued-backtrace`, `insert-all-unknown-attribute-error-takes-a-stand-in-record`
2. **Exclude burn-down.** 5 stories, 5 open, 2,470 est-loc. Waits on RFCs 0127 and 0156 (§ "Ordering").
   - Ready: `activerecord-burn-rails-callback-invocations-exclude`, `activerecord-burn-rails-error-parity-exclude-associations-relation-encryption-tasks`, `activerecord-burn-rails-error-parity-exclude-connection-adapters`, `activerecord-burn-rails-error-parity-exclude-rest`, `activerecord-burn-rails-error-parity-exclude-root`

## Verification

- `eslint/rails-error-parity-exclude.json` holds no `packages/activerecord/` entry, down from 73.
- `eslint/rails-callback-invocations-exclude.json` holds no `packages/activerecord/` entry, down from 5.
- `pnpm lint` is green with both rules on for every activerecord file.
- `pnpm tasks list --rfc 0182-activerecord-error-parity` shows no open story.

## End condition

This RFC closes when every Verification line holds. Until then a raise found to differ from Rails is filed
here with `pnpm tasks new 0182-activerecord-error-parity <slug> --body-file <path>`.

## Open questions

None is open.

1. **Two unsized stories.** Resolved: `expo-sqlite-driver-raises-sqlite3-gem-exception-classes` (200) and
   `sqlite3-new-client-rescues-cantopen-not-enoent` (120) had a slug for a title and no `est-loc`. Both are
   set, which is why the RFC opens at 3,060 est-loc against the DB's 2,740.
2. **Can `expo-sqlite-driver-raises-sqlite3-gem-exception-classes` be verified?** Open inside the story, not
   here: there is no expo runtime in CI, and its first criterion is to establish the error shape.

## Changelog

- 2026-10-06: created by splitting the `errors` cluster out of `0174-activerecord-api-parity-100`. 13
  stories moved (7 ready, 6 draft). The 5 clustered ones change only their `rfc:` line; the 8 that were
  unclustered also take `cluster: errors`, and two a title and an `est-loc`.
