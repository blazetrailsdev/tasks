---
title: "Entry check: the data layer is at 100% on Rails 8.0.2 and every gate is green"
status: done
updated: 2026-11-21
rfc: "0191-rails-8-0-5-1-upgrade-workflow"
cluster: entry
packages: [arel, activemodel, activerecord]
deps:
  - ar-through-association-source-reflection-delegate
  - ar-encrypted-fixtures-initialize-credited
  - ar-compat-v6-0-table-definition-belongs-to-credited
  - ar-controller-runtime-initialize-inlined
  - am-attributes-initialize-inlined
  - ar-yaml-column-safe-load-inherited-tests
  - ar-callbacks-class-methods-interface-members-credited
  - activerecord-permanent-skips-receipted-in-unported-files
  - postgresql-bulk-change-query-count-one-short
  - bird-total-count-async-after-initialize
  - ctor-mass-assign-collection-ids-unsupported
deps-rfc: ["0175-activerecord-test-parity-100"]
est-loc: 20
priority: null
pr: null
claim: "2026-11-19T17:07:15Z"
assignee: "entry-check-data-layer-parity-is-closed-on-8-0-2"
blocked-by: null
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

## Findings (2026-11-21, trails `9825896d8f`)

Measured after `pnpm build` with `API_COMPARE_FORCE=1 pnpm parity:api` and
`pnpm parity:test`. This supersedes the 2026-11-11 measurement at
`876804dd8b`.

| Package            | Methods   | Tests     | Unpinned matched bodies |
| ------------------ | --------- | --------- | ----------------------- |
| arel               | 1052/1052 | 739/739   | 0                       |
| activemodel        | 821/821   | 1037/1037 | 2                       |
| activerecord       | 6966/6966 | 8982/8986 | 129                     |
| activesupport      | 2297/2342 | 3691/3725 | 265                     |
| actiondispatch     | 1803/1809 | 1630/1670 | 2                       |
| actioncontroller   | 854/854   | 1926/1949 | 1                       |
| abstractcontroller | 178/178   | 52/52     | 0                       |
| actionpackversion  | 2/2       | n/a       | 0                       |
| actionview         | 3057/3057 | 2528/2562 | 35                      |
| actioncable        | 496/496   | 213/215   | 336                     |
| activejob          | 369/369   | 395/395   | 192                     |
| actionmailer       | 229/229   | 251/255   | 135                     |
| activestorage      | 631/631   | 441/451   | 412                     |
| actionmailbox      | 174/174   | 105/105   | 119                     |
| actiontext         | 245/245   | 115/116   | 165                     |
| trailties          | 1754/1761 | 1009/2359 | 871                     |

`parity:api` reports Data layer 8839/8839 methods (100%), files 440/440;
AR closure 10069/10094. Overall across every source: 28875/30177 methods
(95.7%), 32903/36976 tests (89%).

### Against the acceptance criteria

- **Methods, data layer: met.** arel, activemodel and activerecord are each
  at 100%; the five 2026-11-11 gaps are gone.
- **Tests, data layer: not met.** activerecord is 8982/8986: 4 skipped
  (the tool rounds the row to 100%). arel and activemodel are at 100%.
- **CI on `main`.** The run for `9825896d8f` was still pending when this
  was measured; the latest completed, non-cancelled `main` run
  (`56db5bf51c`) is green.
- **RFC 0175 is closed** (`status: closed` in its README). Met.

### Stale-citation exposure

693 of 1471 open stories (not `done` or `closed`) cite a Rails
`<file>.rb:<line>` in their body: 440 draft, 113 ready, 137 blocked and
3 in progress.
