---
title: "Entry check: the data layer is at 100% on Rails 8.0.2 and every gate is green"
status: blocked
updated: 2026-11-11
rfc: "0191-rails-8-0-5-1-upgrade-workflow"
cluster: entry
packages: [arel, activemodel, activerecord]
deps: []
deps-rfc: ["0175-activerecord-test-parity-100"]
est-loc: 20
priority: null
pr: null
claim: "2026-11-11T14:45:38Z"
assignee: "entry-check-data-layer-parity-is-closed-on-8-0-2"
blocked-by: "data layer not at 100%: 5 AR/AM methods + 8 AR tests (yaml_column) missing, main CI red at 876804dd8b; findings recorded in story (tasks aaa011434)"
closed-reason: null
---

## Context

RFC § 4. The `rails-8.0.2` tag is meant to mark a complete data layer. On
2026-10-13 (trails `25cc7a1876`): arel 1052/1052 methods and 739/739 tests,
activemodel 821/821 and 1037/1037, activerecord 6980/6980 and 8801/8830.
The owner ruled on 2026-10-13 that RFC 0175 closes before the flip; the
tasks DB records it `closed` (141 stories done or closed) on 2026-11-10.
Five Rails packages were enrolled after the 2026-10-13 figures
(actioncable, actionmailer, activestorage, actionmailbox, actiontext;
`vendor/sources.ts:171-221`).

## Acceptance criteria

- [ ] `API_COMPARE_FORCE=1 pnpm parity:api` and `pnpm parity:test` are run on
      current `main` and every `rails`-source package's row (all sixteen) is recorded in the
      story, replacing the RFC's § "Where we are" table.
- [ ] The latest `main` CI run is green.
- [ ] The count of open stories whose body cites a Rails `file:line` is
      recorded, since those go stale at the flip.
- [ ] arel, activemodel and activerecord are at 100% of methods and of
      tests, and RFC 0175 is closed. The owner ruled on 2026-10-13 that
      RFC 0175 finishes before the flip (RFC § 4, criterion 4), so this
      story's `deps-rfc` edge stays.

## Definition of done

This story changes no gate and ports nothing. A shortfall is reported, not
fixed here.

## Findings (2026-11-11, trails `876804dd8b`)

Measured after `pnpm build` with `API_COMPARE_FORCE=1 pnpm parity:api` and
`pnpm parity:test`. Without the build `parity:api` refuses to measure
(47 packages had no `dist`).

| Package            | Methods   | Tests     | Unpinned matched bodies |
| ------------------ | --------- | --------- | ----------------------- |
| arel               | 1052/1052 | 739/739   | 0                       |
| activemodel        | 820/821   | 1037/1037 | 1                       |
| activerecord       | 6987/6991 | 8940/8965 | 180                     |
| activesupport      | 2110/2266 | 3065/3379 | 137                     |
| actiondispatch     | 1801/1809 | 1627/1670 | 0                       |
| actioncontroller   | 852/854   | 1921/1949 | 1                       |
| abstractcontroller | 178/178   | 52/52     | 0                       |
| actionpackversion  | 2/2       | n/a       | 0                       |
| actionview         | 3057/3057 | 2524/2562 | 34                      |
| actioncable        | 496/496   | 213/215   | 336                     |
| activejob          | 369/369   | 395/395   | 192                     |
| actionmailer       | 230/230   | 251/255   | 135                     |
| activestorage      | 631/631   | 427/451   | 412                     |
| actionmailbox      | 148/167   | 82/87     | 94                      |
| actiontext         | 133/253   | 23/116    | 110                     |
| trailties          | 1661/1787 | 679/2419  | 816                     |

Overall: 26987/28857 methods (93.5%), 29100/33891 tests (85.9%).

### Shortfalls (reported, not fixed here)

- **Methods, data layer: not 100%.**
  activemodel is missing `ActiveModel::Attributes#initialize`.
  activerecord is missing `Associations::ThroughAssociation#source_reflection`,
  `Encryption::EncryptedFixtures#initialize`,
  `Migration::Compatibility::V6_0::TableDefinition#belongs_to` and
  `Railties::ControllerRuntime#initialize`.
- **Tests, activerecord: 8940/8965.** 17 are skipped, and 8 are missing in
  `coders/yaml_column_test.rb`.
- **CI on `main` is red.** The `876804dd8b` run failed the Active Record
  SQLite (1, 2), PostgreSQL (1, 2, 3) and MariaDB (1, 2, 3) shards.
  `96accbb487`, the commit before it, was green.
- **RFC 0175 is closed** (`status: closed` in its README). That criterion is met.

### Stale-citation exposure

907 of 1608 open stories (not `done` or `closed`) cite a Rails
`<file>.rb:<line>` in their body: 639 draft, 149 ready, 111 blocked,
7 claimed and 1 in progress.
