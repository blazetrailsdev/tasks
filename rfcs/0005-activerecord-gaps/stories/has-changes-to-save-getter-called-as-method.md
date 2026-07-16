---
title: "has-changes-to-save-getter-called-as-method"
status: claimed
updated: 2026-07-16
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-16T01:21:13Z"
assignee: "has-changes-to-save-getter-called-as-method"
blocked-by: null
closed-reason: null
---

## Context

Discovered during review of PR #4898, which fixed the same root cause at one
site (`has-one-association.ts`). The remaining five sites are untouched.

`hasChangesToSave` is a **getter**, not a method:
`packages/activemodel/src/model.ts:1952` — `get hasChangesToSave(): boolean`,
mirroring `ActiveModel::Dirty#has_changes_to_save?`. It is deliberately never
wired via `include()`: `packages/activerecord/src/base.ts:5178` documents it as
Category A ("getters on Model.prototype; wiring via `include()` replaces the
getter descriptor with a data property and breaks behavior").

Every association call site treats it as a method. Two distinct failure modes,
both verified by probe against PR #4898's branch:

Mode A — silently dead gate. `typeof record.hasChangesToSave === "function"`
yields `"boolean"`, never `"function"`, so the clause is always false and
Rails' `record.has_changes_to_save?` half of the gate is dropped:

- `associations/collection-association.ts:678`
- `associations/has-many-through-association.ts:138-139`
- `associations/has-many-through-association.ts:596-597`
- `associations/collection-proxy.ts:4165-4166`

Mode B — raises. `associations/has-one-through-association.ts:148` reads
`(record as any)?.hasChangesToSave?.()`. Optional-call short-circuits only on
null/undefined; once `record` is non-nil the getter yields a boolean and
`false?.()` attempts to call `false` as a function.

Probe (persisted owner, re-assign the SAME record to a has_one_through, via the
canonical `Member.hasOne("club", { through: "currentMembership" })`,
member.ts:80) raises:

`TypeError: record?.hasChangesToSave is not a function`

Reachability for Mode B, from has-one-through-association.ts:132-148: `inMemory`
false requires `record === null` or (owner persisted and `save` true); reaching
the third disjunct additionally requires `assigningAnother` false and
`mightNeedDelete` false (the latter is `record === null && !isLoaded()`), so
`record` is non-nil and the getter is read as a call. That is exactly the
persisted-owner same-record re-assign above.

Rails reference: the gate being reproduced is
`vendor/rails/activerecord/lib/active_record/associations/has_one_association.rb:65`
— `if assigning_another_record || record.has_changes_to_save?`. The equivalent
in `collection_association.rb` / `has_many_through_association.rb` should be
read at the corresponding sites rather than assumed identical.

PR #4898 fixed only `has-one-association.ts` (now
`record?.hasChangesToSave === true`) and pinned it with a regression test that
fails on main with `expected 'old name' to be 'new name'`. It was kept scoped to
its own story rather than fanning out.

## Acceptance criteria

- [ ] All five sites read the getter instead of calling it. Sweep them together
      — the same root cause split across PRs invites a partial fix.
- [ ] `has-one-through-association.ts:148` no longer raises on a
      persisted-owner same-record re-assign; pin with a regression test that
      fails on main with `TypeError: record?.hasChangesToSave is not a function`.
- [ ] For each Mode A site, read the corresponding Rails method first and
      confirm the revived gate matches it — reviving a dropped gate changes
      behavior, so each needs its own test showing the newly-reachable branch.
- [ ] Consider a lint rule or grep gate so `hasChangesToSave(` and
      `hasChangesToSave?.(` cannot reappear; the getter/method confusion is
      invisible to `tsc` behind an `as any` cast, which is what hid all six
      sites.
- [ ] No regression in the has_one / has_many / through / autosave suites.
