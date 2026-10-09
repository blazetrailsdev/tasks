---
title: "activerecord: canonical test models seat through registerModel, so each is in its superclass's subclasses"
status: draft
updated: 2026-10-09
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8711 ratified `registerModel` as the model seat (`packages/activerecord/CLAUDE.md` § "A model is seated by `registerModel`"): one call seats the constant and registers the subclass, the pair a Ruby `class Foo < ActiveRecord::Base` does at the `class` keyword (`vendor/rails/v8.0.2/activerecord/lib/active_record/inheritance.rb:287-294`).

Most canonical model files under `packages/activerecord/src/test-helpers/models/` still seat a class with `registerConstant("Foo", Foo)` alone. That binds the constant and registers nothing, so a canonical direct child of `Base` (`Author`, `Post`, `Topic`, …) is absent from `Base.subclasses` until some test calls `registerModel` on it. In Rails every loaded model is in `ActiveRecord::Base.subclasses` (`vendor/rails/v8.0.2/activesupport/lib/active_support/descendants_tracker.rb:97-109`).

trails#8711 converted only the files that already called the one-argument `registerSubclass` (`category.ts`, `comment.ts`, `company.ts`, `membership.ts`, `post.ts`, `reply.ts`, `topic.ts`, `vegetables.ts`, `clothing-item.ts`) and the eight `sharded/*.ts` files.

## Acceptance criteria

- [ ] Every model class in `test-helpers/models/**` is seated by `registerModel`; `registerConstant` remains only for a namespace `Module` and other non-model constants.
- [ ] A namespaced model is seated as `registerModel(rbModConstSet(Namespace, "Name", this))`, as `sharded/*.ts` do.
- [ ] The `for (const klass of [...]) registerModel(klass)` tails in the nine files above are replaced by a seat at each class.
- [ ] Loading a canonical model file alone puts its classes in their superclass's `subclasses`.
- [ ] `pnpm parity:fixtures:models` stays at diff=0 missing=0.
