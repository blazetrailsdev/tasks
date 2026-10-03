---
title: "ActiveRecord validators are constants of ActiveRecord::Validations, not statics of Base"
status: draft
updated: 2026-10-03
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails PR 8448, which made `validates` resolve its validator through
`const_get` (`vendor/rails/v8.0.2/activemodel/lib/active_model/validations/validates.rb:120-124`)
and seated the bundled validators as constants of `ActiveModel::Validations`
(`packages/activemodel/src/validations.ts`).

Rails defines ActiveRecord's validators as constants of the
`ActiveRecord::Validations` module — `AbsenceValidator`
(`activerecord/lib/active_record/validations/absence.rb:5`), `AssociatedValidator`
(`associated.rb:5`), `LengthValidator` (`length.rb:5`), `NumericalityValidator`
(`numericality.rb:5`), `PresenceValidator` (`presence.rb:5`), `UniquenessValidator`
(`uniqueness.rb:5`) — and `const_get` on a model finds them there because
`ActiveRecord::Validations` is included after, and so ahead of,
`ActiveModel::Validations` in the ancestry.

trails instead assigns the six as static properties of `Base`
(`packages/activerecord/src/base.ts:2497-2502`), which `rbConstGet` answers at
its first arm. That is an invented seat: `Base::PresenceValidator` is not where
Rails defines the constant.

## Acceptance criteria

- [ ] The six validators are seated with `rbModConstSet` on the
      `ActiveRecord::Validations` module trails includes into `Base`, and the
      static assignments in `base.ts` are deleted.
- [ ] `Topic.validates("title", { presence: true })` resolves
      `ActiveRecord::Validations::PresenceValidator` through the included-module
      arm of `rbConstGet`, ahead of ActiveModel's; uniqueness and associated
      validations still resolve.
- [ ] Built-`dist` entry-module imports of `validations.js` and `base.js` show
      no TDZ.
