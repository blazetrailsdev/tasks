---
rfc: "0183-activerecord-excluded-source-files"
title: "activerecord excluded source files: port or measure every .rb on the unported list — split from RFC 0174"
status: active
created: 2026-10-06
updated: 2026-10-06
owner: "@deanmarano"
packages:
  - "activerecord"
  - "ruby-compat"
  - "trailties"
clusters:
  - excluded-files
related-rfcs:
  - "0174-activerecord-api-parity-100"
  - "0175-activerecord-test-parity-100"
  - "0178-activerecord-arms-parity-100"
  - "0180-activerecord-receipt-parity"
  - "0181-activerecord-member-placement"
  - "0182-activerecord-error-parity"
  - "0041-activesupport-messagepack-ext"
  - "0116-activejob-dependent-activerecord-work"
  - "0123-blocked-convergence-holding"
  - "0154-ruby-compat-surfaced-deviations"
  - "0170-psych-in-ruby-compat"
priority: 2
---

# RFC 0183 — activerecord excluded source files: port or measure every .rb on the unported list

## Summary

`parity:api` scores activerecord at 100% of files only because some Rails source files are held out of the
comparison by `scripts/parity/unported-files/`. This RFC holds the work of taking each one off that list by
porting it, or by measuring a port that already exists. It was split out of
`0174-activerecord-api-parity-100` on 2026-10-06 with the 11 stories of 0174's `excluded-files` cluster plus
the 3 unclustered stories about `promise.rb`. **14 stories, 11 open, 2,680 est-loc**, 3 of them blocked. The
destination of a story is decided by one question: **is the `.rb` it ports on the unported-files list?**

## Motivation

An excluded file is the cheapest way to look complete: its methods are neither missing nor matched. Each
story here is a self-contained port of one file with its own test file, usually behind a dependency in
another RFC (psych, marshal, message pack). None of them touches the files the rest of 0174 rewrites, so
they read better as their own list than as rows 12 to 22 of a 301-story backlog.

### Baseline

Measured 2026-10-06 on trails `main` @ `53cf6a5875`, from `scripts/parity/unported-files/`. 0174's baseline
of 2026-09-30 was 13 excluded source files (152 defs).

| Excluded `.rb`                            | Story                                                             | State                    |
| ----------------------------------------- | ----------------------------------------------------------------- | ------------------------ |
| `fixtures.rb`                             | `activerecord-unexclude-and-measure-fixtures-rb`                  | done, off the list       |
| `fixtures.rb#initialize` (scoped skip)    | `activerecord-fixture-initialize-prepend-constructor`             | blocked                  |
| `encryption/encrypted_fixtures.rb`        | `activerecord-port-encrypted-fixtures-module`                     | ready                    |
| `version.rb` (and `gem_version.rb`)       | `activerecord-port-version-and-gem-version`                       | ready                    |
| `dynamic_matchers.rb`                     | `activerecord-unexclude-dynamic-matchers`                         | ready                    |
| `marshalling.rb`                          | `activerecord-port-marshalling-module`                            | ready, waits on RFC 0154 |
| `message_pack.rb`                         | `activerecord-port-message-pack-module`                           | ready, waits on RFC 0041 |
| `legacy_yaml_adapter.rb`                  | `activerecord-port-legacy-yaml-adapter-and-yaml-column`           | ready, waits on RFC 0170 |
| `railties/controller_runtime.rb`          | `activerecord-port-railties-controller-runtime`                   | ready                    |
| `promise.rb`                              | `record-native-promise-decision-and-retire-promise-complete-rows` | decided: not ported      |
| `trilogy_adapter.rb`, `adapters/trilogy/` | `activerecord-port-trilogy-adapter`                               | blocked                  |
| `destroy_association_async_job.rb`        | `port-destroy-association-async-job` (RFC 0116)                   | not in this RFC          |

Target: the list holds no activerecord source file except the blocked and decided ones, each named in
0174's close-out table.

## Design

### Scope

**In:** a story that ports, or un-excludes and measures, a Rails source file matched by an entry of
`scripts/parity/unported-files/`, and a story that records a decision not to port one.

### Where a story goes

This table is repeated in 0174 § "Split: RFCs 0180 to 0183".

| The story's first acceptance criterion                                                                                                   | File it in |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| moves a member into the file mirroring the `.rb` that defines it (`inlined-from`, `parity:api:moves`)                                    | RFC 0181   |
| changes an error class, message or raise site, or deletes an error-parity / callback-invocations exclude row                             | RFC 0182   |
| ports or un-excludes a `.rb` listed in `scripts/parity/unported-files/`                                                                  | here       |
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
- **The entry is deleted in the PR that ports the file**, with its `baseline.json` row, so `parity:api`
  scores the file from that PR on. A port that leaves the entry in place has not landed.
- **A gem-backed file wraps an npm client and is async from the start.** No empty `TopLevel` seat is added
  for a gem trails does not have.
- **The test file comes with it.** Where the unported entry names a `testFile`, the same PR ports it or
  files it in RFC 0175.

### Ordering

- `activerecord-port-encrypted-fixtures-module` follows `activerecord-unexclude-and-measure-fixtures-rb`
  (done), so it is claimable.
- `activerecord-port-marshalling-module` waits on `ruby-compat-marshal-core-types` (RFC 0154);
  `activerecord-port-message-pack-module` on `message-pack-serializer-pool-and-packer-block` (RFC 0041,
  draft); `activerecord-port-legacy-yaml-adapter-and-yaml-column` on `yaml-column-safe-coder-through-psych`
  and `active-record-legacy-yaml-load-tags` (RFC 0170, draft).
- `record-native-promise-decision-and-retire-promise-complete-rows` goes before anything else touches
  `promise.rb` (§ "Open questions" 1).

### Gating

- **`active` from birth**, for 0174's reason: `claimable()` surfaces a story only when its own RFC is
  `active`. The 7 `ready` stories here were claimable in 0174 and stay claimable.
- **Edges out of this RFC:** the four above, plus `activerecord-fixture-initialize-prepend-constructor` on
  `activemodel-api-initialize-concern-constructor` (RFC 0123). The one edge into RFC 0174 is on a done story.
- **Edges into this RFC, open:** `activerecord-converge-statement-cache-execute-async-arm` and
  `activerecord-score-core-object-protocol-names` (both RFC 0174) and `activerecord-gate-report-only-arm-tokens`
  (RFC 0178) wait on `record-native-promise-decision-and-retire-promise-complete-rows`. The two 0174 stories waited on
  `activerecord-port-promise` until 2026-10-06, when they were re-pointed with `tasks set-deps`.
- **Edges into this RFC from the 0174 close-out.** `activerecord-api-parity-100-close-out` named these
  stories one by one in `deps`. This split replaces those entries with one `deps-rfc` edge on
  `0183-activerecord-excluded-source-files`, the whole-RFC case 0174 § "Gating" describes: the close-out waits until this RFC is
  closed, including stories filed here later. The edit is in the split's own diff, so nothing is owed
  after merge.

## Stories

| Story                                                             | est-loc | Cluster        |
| ----------------------------------------------------------------- | ------- | -------------- |
| `activerecord-fixture-initialize-prepend-constructor`             | 250     | excluded-files |
| `activerecord-port-encrypted-fixtures-module`                     | 150     | excluded-files |
| `activerecord-port-legacy-yaml-adapter-and-yaml-column`           | 250     | excluded-files |
| `activerecord-port-marshalling-module`                            | 250     | excluded-files |
| `activerecord-port-message-pack-module`                           | 350     | excluded-files |
| `activerecord-port-promise`                                       | 250     | excluded-files |
| `activerecord-port-railties-controller-runtime`                   | 250     | excluded-files |
| `activerecord-port-trilogy-adapter`                               | 650     | excluded-files |
| `activerecord-port-version-and-gem-version`                       | 80      | excluded-files |
| `activerecord-unexclude-and-measure-fixtures-rb`                  | 500     | excluded-files |
| `activerecord-unexclude-dynamic-matchers`                         | 150     | excluded-files |
| `async-readers-return-activerecord-promise-for-pending-queries`   | —       | excluded-files |
| `port-promise-complete-for-async-loaded-arms`                     | 220     | excluded-files |
| `record-native-promise-decision-and-retire-promise-complete-rows` | 80      | excluded-files |

## Blocked

- `activerecord-fixture-initialize-prepend-constructor`: a JS class constructor cannot be wrapped after
  definition; ruby-compat's `prepend()` wraps prototype methods only, and CLAUDE.md ratifies no
  constructor-splicing mechanism. Blocked with `activemodel-api-initialize-concern-constructor` on a
  ruby-compat construction hook.
- `activerecord-port-trilogy-adapter`: no JS/npm client for the trilogy C library exists; wrapping mysql2's
  npm driver under Rails' `TrilogyAdapter` name would invent a second `Mysql2Adapter`. It needs a
  trilogy-compatible JS client. This is an ecosystem blocker, not a CLAUDE.md-ratified shortcoming.
- `port-promise-complete-for-async-loaded-arms`: maintainer decision of 2026-10-01 (trails#8342):
  `ActiveRecord::Promise` is not ported and the `async_*` readers return native promises. It is blocked
  and not closed because trails cites it 4 times, and closing a cited story reds `stale-story-references`.

## Non-goals

- **`destroy_association_async_job.rb`.** `port-destroy-association-async-job` is owned by RFC 0116 with
  the rest of activejob. 0174's close-out depends on it directly.
- **The Rails tests excluded through the same register.** RFC 0175's `unported-tests` cluster.
- **Skip groups.** A method held out by `SKIP_GROUPS` / `SCOPED_SKIP_GROUPS` in a file that is otherwise
  scored is 0174's `skips` cluster. The one exception is `fixtures.rb#initialize`, which moved here with
  the file it belongs to.
- **Other packages' unported files.**
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

- **Leave the three `promise.rb` stories in 0174**: rejected. `activerecord-port-promise` depends on one of
  them, and all four are about one excluded file and one decision.
- **Move `port-destroy-association-async-job` in from RFC 0116**: rejected. It needs activejob's queue
  adapters, which is that RFC's subject.

## Rollout

Status is from the DB as of 2026-10-06.

1. **`promise.rb`: record the decision.** 4 stories, 2 open, 300 est-loc. The draft is the only work to do.
   - Draft: `record-native-promise-decision-and-retire-promise-complete-rows`
   - Blocked: `port-promise-complete-for-async-loaded-arms`
   - Closed: `activerecord-port-promise`, `async-readers-return-activerecord-promise-for-pending-queries`
2. **Fixtures.** 3 stories, 2 open, 400 est-loc.
   - Ready: `activerecord-port-encrypted-fixtures-module`
   - Blocked: `activerecord-fixture-initialize-prepend-constructor`
   - Done: `activerecord-unexclude-and-measure-fixtures-rb` (trails#8359)
3. **The other files.** 7 stories, 7 open, 1,980 est-loc.
   - Ready: `activerecord-port-legacy-yaml-adapter-and-yaml-column`, `activerecord-port-marshalling-module`, `activerecord-port-message-pack-module`, `activerecord-port-railties-controller-runtime`, `activerecord-port-version-and-gem-version`, `activerecord-unexclude-dynamic-matchers`
   - Blocked: `activerecord-port-trilogy-adapter`

## Verification

- `scripts/parity/unported-files/` matches no activerecord source file except `trilogy_adapter.rb` /
  `adapters/trilogy/` (blocked), `promise.rb` (decided) and `destroy_association_async_job.rb` (RFC 0116).
- `pnpm parity:api` scores activerecord's files and methods at 100% with those entries removed.
- `SCOPED_SKIP_GROUPS` holds no `Fixture#initialize` entry, or the story is still blocked and named in
  0174's close-out table.
- `pnpm tasks list --rfc 0183-activerecord-excluded-source-files` shows no open story except the blocked ones.

## End condition

This RFC closes when every Verification line holds.

## Open questions

1. **`activerecord-port-promise` contradicted a decision already made.** Resolved on 2026-10-06. The story
   asked for a port of `promise.rb`; on trails#8342 (2026-10-01) the maintainer decided
   `ActiveRecord::Promise` is not ported and a complete port was reverted. The two 0174 stories that
   depended on it (`activerecord-converge-statement-cache-execute-async-arm`,
   `activerecord-score-core-object-protocol-names`) were re-pointed at
   `record-native-promise-decision-and-retire-promise-complete-rows` with `tasks set-deps`, and the port
   story was closed with `tasks close` and the decision as its reason. No trails file cites it. Nothing in
   this RFC now asks for the port: when the decision story closes
   `port-promise-complete-for-async-loaded-arms`, no story is released by it.
2. **Does `promise.rb` stay on the unported list for good?** Follows from 1: yes, as a decided entry with
   the decision cited in its `reason`, which the decision story's criteria cover.

## Changelog

- 2026-10-06: created by splitting the `excluded-files` cluster out of `0174-activerecord-api-parity-100`.
  14 stories moved (1 done, 7 ready, 1 draft, 3 blocked, 2 closed). The 11 clustered ones change only their
  `rfc:` line; the 3 `promise.rb` stories also take `cluster: excluded-files`.
- 2026-10-06 (review): `activerecord-port-promise` closed with the trails#8342 decision as its reason, after
  its two dependants in RFC 0174 were re-pointed at the decision story. 11 open, 2,680 est-loc.
