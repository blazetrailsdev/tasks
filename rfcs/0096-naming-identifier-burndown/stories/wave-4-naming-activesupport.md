---
title: "Burn down the naming call-argument rows in activesupport"
status: done
updated: 2026-08-15
rfc: "0096-naming-identifier-burndown"
cluster: api-compare
packages: ["activesupport"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6558
claim: "2026-08-15T01:15:12Z"
assignee: "wave-1-relation-ts"
blocked-by: null
closed-reason: null
---

## Context

One of the seven clusters `wave-4-cluster-remaining-naming-rows` split the RFC
0096 naming residue into, so that `naming-gate-flip` has a checkable
precondition rather than a judgement call. Measured 2026-08-14 from a full
`pnpm build`, `API_COMPARE_FORCE=1 pnpm parity:api --calls`, then
`pnpm parity:api:calls:args:report`: 108 in-scope `class: "naming"` rows
survive, 37 of them in the permanent classes of
`scripts/api-compare/naming-taxonomy.ts` and 71 as burndown work. This story
owns **10** of those 71.

Every row here is `class: "burndown"`: a local or parameter that simply is not carrying its Rails identifier, camelCased. That is free fidelity — rename it to what the Ruby calls it. Read the Rails body in `vendor/rails/` first and cite `gem/path.rb:LINE` for each rename; a handful of rows are recorder shape (a chained or nested call the recorder attributes to the wrong callee) and those are reported in the PR body with the Ruby `file:line`, not converged and not baselined.

| File                                                       | Method                          | Call                      | Differing identifiers                                    |
| ---------------------------------------------------------- | ------------------------------- | ------------------------- | -------------------------------------------------------- |
| `activesupport/cache/memory-store.ts`                      | `modifyValue`                   | `write`                   | Integer -> integer                                       |
| `activesupport/encrypted-file.ts`                          | `writing`                       | `basename`                | contentPath -> resolved                                  |
| `activesupport/message-pack/serializer.ts`                 | `load`                          | `unpacker`                | messagePackPool -> dumped                                |
| `activesupport/messages/metadata.ts`                       | `deserializeFromJsonSafeString` | `deserialize`             | decode -> toString                                       |
| `activesupport/module-ext.ts`                              | `moduleParent`                  | `constantize`             | moduleParentName -> parentName                           |
| `activesupport/notifications.ts`                           | `instrument`                    | `instrument`              | instrumenter -> name; name -> resolved; payload -> block |
| `activesupport/number-helper/number-to-phone-converter.ts` | `convert`                       | `convert_to_phone_number` | strip -> replace                                         |
| `activesupport/time-with-zone.ts`                          | `dst`                           | `dst?`                    | period -> toInstant                                      |
| `activesupport/time-with-zone.ts`                          | `zone`                          | `abbreviation`            | period -> toInstant                                      |
| `activesupport/values/time-zone.ts`                        | `rfc3339`                       | `new`                     | utc -> instantFrom                                       |

## Acceptance criteria

- [ ] Locals and parameters in the files above carry the Rails identifier, camelCased,
      with the Rails `file:line` cited for each.
- [ ] `pnpm parity:api:calls:args:report` shows the in-scope `naming` count down
      by the rows converged here, and no new `shape` rows.
- [ ] No baseline row is added, widened or reseeded; `naming` stays report-only
      until `naming-gate-flip`.
- [ ] Any row left standing is named in the PR body with its reason and, when it
      is a real defect rather than recorder shape, the follow-up story it was
      filed against.
