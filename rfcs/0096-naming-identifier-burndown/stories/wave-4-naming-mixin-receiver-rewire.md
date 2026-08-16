---
title: "Rewire the module-mixin-receiver naming rows to the this-typed mixin idiom"
status: done
updated: 2026-08-16
rfc: "0096-naming-identifier-burndown"
cluster: api-compare
packages: ["activerecord", "activesupport", "activemodel"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6583
claim: "2026-08-15T23:29:05Z"
assignee: "wave-4-naming-mixin-receiver-rewire"
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
owns **7** of those 71.

Every row here is `class: "module-mixin-receiver"`: Ruby writes `self` and trails passes the receiver as a leading parameter under some other name. These converge by rewiring to the `this`-typed mixin idiom (CLAUDE.md, _Module mixins_) — **not** by renaming the parameter, and never by baselining.

| File                                    | Method           | Call       | Differing identifiers                  |
| --------------------------------------- | ---------------- | ---------- | -------------------------------------- |
| `activemodel/model.ts`                  | `validatesWith`  | `validate` | this -> r                              |
| `activemodel/model.ts`                  | `validatesWith`  | `validate` | this -> r                              |
| `activerecord/insert-all.ts`            | `toSql`          | `new`      | this -> adapterName                    |
| `activerecord/relation.ts`              | `findByTokenFor` | `new`      | this -> model                          |
| `activesupport/class-attribute.ts`      | `classAttribute` | `redefine` | this -> klass; default -> defaultValue |
| `activesupport/notifications/fanout.ts` | `buildHandle`    | `new`      | this -> groups                         |
| `activesupport/string-inquirer.ts`      | `inquiry`        | `new`      | this -> value                          |

## Acceptance criteria

- [ ] Each row above is either rewired to the `this`-typed mixin idiom so the receiver
      is `this` on both sides, or carries a call-site justification citing the Rails
      `file:line` that makes the leading-parameter shape necessary.
- [ ] `pnpm parity:api:calls:args:report` shows the in-scope `naming` count down
      by the rows converged here, and no new `shape` rows.
- [ ] No baseline row is added, widened or reseeded; `naming` stays report-only
      until `naming-gate-flip`.
- [ ] Any row left standing is named in the PR body with its reason and, when it
      is a real defect rather than recorder shape, the follow-up story it was
      filed against.
