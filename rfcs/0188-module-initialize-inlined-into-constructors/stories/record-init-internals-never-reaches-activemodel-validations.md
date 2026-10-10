---
title: "activerecord: a record's init_internals never reaches ActiveModel::Validations#init_internals"
status: blocked
updated: 2026-10-03
rfc: "0188-module-initialize-inlined-into-constructors"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: "Base extends Model, and Model's API include puts the ActiveModel::Validations link above Model.prototype, so every module Base includes (Core's root among them) sits beneath it in a record's ancestry. Core#init_internals calls no super (core.rb:834), so nothing beneath it can reach a link above it, and include() skips a module already in the superclass ancestry (class.c:1281), so Base cannot re-include Validations after Core as activerecord/validations.rb does. Unblocks when Base includes ActiveModel::API's modules itself instead of inheriting them from Model."
closed-reason: null
---

## Context

`ActiveRecord::Core#init_internals` (`vendor/rails/v8.0.2/activerecord/lib/active_record/core.rb:834`)
is the root of ActiveRecord's chain, and `ActiveModel::Validations#init_internals`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/validations.rb:467-471`) runs above it, because
`ActiveRecord::Validations` includes `ActiveModel::Validations` after `Core`
(`activerecord/lib/active_record/base.rb`).

In trails `Base extends Model`, and `Model` includes `API`, whose `included` hook includes
`Validations` (`packages/activemodel/src/api.ts`). So the `Validations` link sits above
`Model.prototype`, and every link `Base` includes sits beneath it. The sibling story
`model-constructor-calls-init-internals-rails-does-not` made Core's `initInternals` the root by
including it as `Base`'s first module (`packages/activerecord/src/base.ts`), which is the highest
position `Base` can give it. `ActiveModel::Dirty#init_internals` is included into `Base` and still
runs above Core. `Validations#initInternals` (`packages/activemodel/src/validations.ts`) is above
Core and is no longer reached by a record, where Rails runs it.

Nothing observes it today: its body is `@context_for_validation = nil` on an object that has just
been allocated, and `context_for_validation` reads the ivar lazily (`validations.rb:479-481`).

## Acceptance criteria

- [ ] A record's `init_internals` runs `ActiveModel::Validations#init_internals` above
      `Core#init_internals`, in Rails' order, with Core still calling no `super`.
- [ ] A test in `packages/activerecord/src/core.trails.test.ts` pins that the Validations body ran.
