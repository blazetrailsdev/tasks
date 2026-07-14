---
title: "type-enum-column-declares-as-label-union"
status: ready
updated: 2026-07-14
rfc: "0050-enum-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Canonical test models type their enum-backed columns as the _stored_ integer,
but trails (like Rails) reads an enum attribute back as its **label string**.
The `declare` is therefore a type lie: it says `number` where reads yield
`"published"` / `"female"`.

Found during review of PR #4864 (register-lions-fixture-set-for-abstract-cat-enum),
where the new test asserts `expect(found.gender).toBe("female")` against a
`declare gender: number`. `toBe` is loosely typed, so the contradiction compiles
silently — nothing catches it.

That PR fixed only the model it depended on
(`test-helpers/models/cat.ts` → `declare gender: "female" | "male" | null`) and
registered this story for the rest rather than fanning out.

Known remaining sites (grep `declare status|declare .*_status` under
`packages/activerecord/src/test-helpers/models/`):

- `models/book.ts:143` — `declare nullable_status: number` (enum
  `nullable_status`; `books.nullable_status` is an integer column).
- `models/book.ts:146` — `declare status: number | null` (enum `status`).
- `models/company.ts:53` — `declare status: number | null` — verify whether
  `status` is actually an enum here before touching it.
- `models/cpk.ts:210`, `models/account.ts:18` — `declare status: string`;
  confirm enum vs plain string column.

Rails source: enum labels come back as strings
(`vendor/rails/activerecord/lib/active_record/enum.rb` — `EnumType#deserialize`
maps the stored value back through the mapping). Rails' own models
(`test/models/cat.rb:11`, `test/models/book.rb`) declare nothing, so these
`declare`s are trails-only typing and must describe the _read_ surface.

## Acceptance criteria

- Every `declare` for an enum-backed column in
  `packages/activerecord/src/test-helpers/models/` is typed as the label union
  (plus `| null` where the column is nullable), not the stored integer.
- Non-enum `status` columns are left alone — verify each site against the
  model's `enum(...)` call and the canonical schema before changing it.
- No `as any` / `as unknown` casts added at call sites to absorb the retype; if a
  test needed a cast to compile before, it should now compile without one.
- Existing suites stay green (`enum.test.ts`, `enum.trails.test.ts`, and any
  suite touching the retyped models).
