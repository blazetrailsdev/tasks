---
title: "Overridable method-signature interfaces for the remaining Included<> mixins a model extends"
status: draft
updated: 2026-10-22
rfc: "0198-activerecord-mixin-host-typing"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9231 fixed TS2425 for `Conversion` only, by declaring an interface with method signatures derived from its functions (`packages/activemodel/src/conversion.ts`). `Included<M>` (`packages/ruby-compat/src/include.ts:1603`) is a mapped type, and a mapped type always produces property members, so a subclass cannot override any other mixin method with a method. Rails lets a model override any included method (for example `ActiveModel::Validations#valid?`, or the instance methods `ActiveModel::Serialization` provides).

## Acceptance criteria

- List every `Included<typeof M>` that a model class extends in activemodel and activerecord.
- Give each module a user is expected to override a method-signature interface derived from its functions (`Parameters<typeof f>` / `ReturnType<typeof f>`), with a type-level override test.
