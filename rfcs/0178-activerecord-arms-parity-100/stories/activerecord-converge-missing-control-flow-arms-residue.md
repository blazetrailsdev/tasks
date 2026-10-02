---
title: "activerecord: converge the 15 missing-arm pairs no missing-arm story names"
status: draft
updated: 2026-10-02
rfc: "0178-activerecord-arms-parity-100"
cluster: arms
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:arms:report --package=activerecord --direction=missing --top=500` lists 38 pairs on
trails `main` @ `5659ce9eb3`. 23 of them have an owner whose acceptance criteria delete the row:
`activerecord-converge-missing-control-flow-arms-connection-adapters-part-2` (18),
`column-deduplicated-drops-the-string-dedup-arms`,
`composite-primary-key-predicate-reads-the-primary-key-setter-ivar`,
`arms-report-idiom-fold-and-catch-all-else-manufacture-missing-arms` (`withinNewTransaction`),
`quoted-date-usec-arm-is-relocated-into-sql-datetime` (RFC 0174, `quotedDate`) and
`record-native-promise-decision-and-retire-promise-complete-rows` (RFC 0174, `calculations.ts#pluck`).

The other 15 are below. The five area missing-arm stories are done and did not take them. 11 are named
by an open invented-arm story, but those stories' criteria are about the `+` tokens, and RFC 0178
§ "Ordering" restores a missing arm before an invented guard is removed. Rails paths are under
`vendor/rails/v8.0.2/activerecord/lib/active_record/`; TS paths under `packages/activerecord/src/`.

| TS `file#method`                             | Rails `file:line`                       | Tokens                     |
| -------------------------------------------- | --------------------------------------- | -------------------------- |
| `attribute-methods.ts#attributeNames`        | `attribute_methods.rb:236` (and `:334`) | `-if`                      |
| `encryption/cipher.ts#encrypt`               | `encryption/cipher.rb:15`               | `-if`                      |
| `fixtures.ts#readFixtureFiles`               | `fixtures.rb:781`                       | `-loop +if +if`            |
| `type/adapter-specific-registry.ts#register` | `type/adapter_specific_registry.rb:19`  | `-if`                      |
| `enum.ts#_enum`                              | `enum.rb:222`                           | `-loop -loop` and 28 `+if` |
| `migration.ts#loadMigration`                 | `migration.rb:1194`                     | `-try -rescue +if +throw`  |
| `model-schema.ts#resetColumnInformation`     | `model_schema.rb:523`                   | `-loop +try +rescue`       |
| `relation/merger.ts#mergeJoins`              | `relation/merger.rb:117`                | `-if`                      |
| `relation/merger.ts#mergeOuterJoins`         | `relation/merger.rb:136`                | `-if`                      |
| `schema-dumper.ts#constructor`               | `schema_dumper.rb:74`                   | `-try -rescue +if +if`     |
| `statement-cache.ts#execute`                 | `statement_cache.rb:145`                | `-if`                      |
| `tasks/database-tasks.ts#create`             | `tasks/database_tasks.rb:115`           | `-rescue +if`              |
| `tasks/database-tasks.ts#drop`               | `tasks/database_tasks.rb:210`           | `-rescue +if`              |
| `tasks/database-tasks.ts#classForAdapter`    | `tasks/database_tasks.rb:574`           | `-loop`                    |
| `type/type-map.ts#performFetch`              | `type/type_map.rb:43`                   | `-loop +if +if`            |

Two cautions before porting an arm:

- **Count Rails' real arms first.** A `-loop` or `-if` beside an enumerable idiom (`uniq`, `compact`,
  `concat`, `delete_if`, `each_value`) may be manufactured by the fold. Those go to
  `arms-report-fold-credits-idiom-arms-by-presence` or
  `arms-report-idiom-fold-and-catch-all-else-manufacture-missing-arms`, not into the port. Name each one
  you route there in the PR body.
- **`statement-cache.ts#execute`'s `-if` may be Rails' `async` arm.** If it is the `Promise::Complete` /
  async arm trails does not port (native promises), it is not converged here: it belongs with
  `record-native-promise-decision-and-retire-promise-complete-rows` and
  `activerecord-converge-statement-cache-execute-async-arm` (both RFC 0174). Say which in the PR body.

Re-measure first. The list above is from 2026-10-02 and the report is not gated.

## Acceptance criteria

- [ ] Each pair above takes every arm its Rails body takes, in Rails' order, or is named in the PR body
      as routed to one of the stories in "Two cautions" with the reason.
- [ ] This story removes `-` tokens only. An invented `+` token on the same pair stays with the
      invented-arm story that lists it.
- [ ] The missing-direction report lists no activerecord pair outside those owned by the six stories in
      the first paragraph and those routed above.
- [ ] No baseline row, receipt or skip is added. `pnpm parity:api:calls` and `pnpm parity:api:calls:args`
      stay green.
- [ ] If the work exceeds one PR, the remainder is filed here as its own story with its pair list.

## Verification

```bash
pnpm build && API_COMPARE_FORCE=1 pnpm parity:api --calls
pnpm parity:api:arms:report --package=activerecord --direction=missing --top=500
pnpm parity:api:calls && pnpm parity:api:calls:args
```
