---
title: "activerecord: Base's constructor enters Inheritance::ClassMethods#new for a bare new Klass"
status: closed
updated: 2026-10-07
rfc: "0181-activerecord-member-placement"
cluster: null
packages: []
deps:
  - inheritance-class-methods-new-body-is-fused-into-base-constructor
deps-rfc: []
est-loc: 300
priority: null
pr: trails#8659
claim: "2026-10-07T21:15:54Z"
assignee: "inheritance-class-methods-new-body-is-fused-into-base-constructor"
blocked-by: null
closed-reason: "Owner decision on trails#8659: records are built with the JS new expression only and static Klass.new is deleted, so the constructor re-entry arm and _instantiation slot this story owned never ship. Recorded in CLAUDE.md § A record is built with new Klass only."
---

## Context

Rails has one way to build a record, `Klass.new(attributes, &block)`, and
`Inheritance::ClassMethods#new`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/inheritance.rb:56-78`) is where the
abstract-class raise and the STI subclass dispatch run before `super` reaches `Class#new`.

trails has two spellings: `Klass.new(attributes, block)`, now `Inheritance.ClassMethods.new` in
`packages/activerecord/src/inheritance.ts`, and the JS expression `new Klass(attributes, block)`,
which is what most of the repo and every application writes. So that a bare `new` still raises for
an abstract class and still answers the STI subclass, `Base`'s constructor
(`packages/activerecord/src/base.ts`) returns `new.target.new(attributes, initBlock)` unless it was
entered from `ClassMethods.new`'s `super` arm or from `allocate`. The `super` arm marks itself
through the one-shot `_instantiation` slot in `inheritance.ts`, which `Persistence#becomes`
(`persistence.rb:487-501`, `klass.allocate` + `initialize`) also sets to skip the dispatch.

Costs of the shape: a bare `new` runs two constructor frames, and a subclass's own field
initializers and constructor tail run twice on the returned record. The arm carries
`@inventedArm new` pointing at this story.

## Acceptance criteria

- [ ] Either the constructor arm and `_instantiation` are gone, with `Base`'s constructor being
      `Core#initialize` (`core.rb:471-482`) alone and `Class#new` reached some other way, or the repo
      owner ratifies "a bare `new Klass` is `Klass.new`" in a CLAUDE.md section and the receipt
      becomes `PERMANENT` citing it.
- [ ] `becomes` reaches `allocate` + `initialize` as `persistence.rb:487-501` does, without the slot.
- [ ] `inheritance.test.ts`, `persistence.test.ts` and `core.trails.test.ts` stay green.
