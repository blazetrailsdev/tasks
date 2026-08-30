---
title: "converge-ar-dirty-test-off-the-rec-alias"
status: ready
updated: 2026-08-30
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: 30
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `dirty_test.rb` writes attributes straight onto the model:

```ruby
pirate.parrot_id = 0            # dirty_test.rb:231
pirate.parrot_id = "0"          # dirty_test.rb:237
assert_nil pirate.parrot_id_change  # dirty_test.rb:189
```

`packages/activerecord/src/dirty.test.ts:25` instead declares

```ts
type Rec = Base & Record<string, unknown>;
```

and routes **73** call sites through `as unknown as Rec`, plus a bespoke
`call<T>(recv, name)` helper (`dirty.test.ts:27-30`) that looks a member up by
string and invokes it. Both exist only because the models under test — `Pirate`,
`Parrot`, `Topic`, `NumericData`, `Aircraft`, `Person` — do not declare their
attributes and dirty-tracking members on the type side.

Before PR #7222 the casts were `as Rec`; `ActiveModel::Model`'s
`[key: string]: unknown` made them legal. That index signature is gone, so they
are now `as unknown as Rec` — louder, and unchanged in substance. Neither `Rec`
nor `call()` has a Rails counterpart.

## Converged shape

Give the canonical models the `declare` lines for the attributes and generated
dirty members these tests read (`parrot_id`, `parrot_id_change`,
`parrot_id_will_change`, `catchphrase`, …), the way
`test-helpers/models/topic.ts` and `subscription.ts` already declare theirs,
then delete `type Rec`, every `as unknown as Rec`, and the `call()` helper. The
bodies should read `pirate.parrot_id = 0` exactly as
`vendor/rails/activerecord/test/cases/dirty_test.rb:231` does.

## Acceptance criteria

- [ ] `type Rec` and the `call()` helper are gone from `dirty.test.ts` and
      `dirty.trails.test.ts`.
- [ ] No `as unknown as Rec` remains; writes and reads are direct member access.
- [ ] `pnpm typecheck` clean; AR suite green on all three lanes.
