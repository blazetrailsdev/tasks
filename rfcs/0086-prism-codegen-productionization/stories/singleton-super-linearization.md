---
title: "Resolve supers on the singleton ancestry"
status: closed
updated: 2026-08-05
rfc: "0086-prism-codegen-productionization"
cluster: null
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded by the 2026-08-05 prism-codegen coverage audit: the generator is being retired (0084-wide-call-set-burndown/retire-prism-codegen-tooling), so improving its output is work on a deleted directory. Evidence: 0 shipped lines from codegen:apply, 963 tsc errors across all 10 emitted files, 81.8% whole-corpus node coverage that does not translate to usability."
---

## Context

`walk()` in `scripts/prism-codegen/linearization.ts` deliberately returns on
`SingletonClassNode` and skips `def self.x`, because singleton methods live on
a separate ancestry from the instance chain (`indexModuleDefs` JSDoc). The
consequence is that every `super` inside a `ClassMethods` module or a
`class << self` body declines as outside-corpus — visible in the goldens as
`__PRISM_SUPER_OUTSIDE_CORPUS("Core::ClassMethods#find")` and friends.

Ruby resolves those through the singleton ancestry, which is just as
statically computable: `extend`/`ClassMethods` inclusion order gives a second
linearization over singleton defs.

## Acceptance criteria

- A singleton-side ancestry (from `extend` plus `ClassMethods` modules) with
  its own def index of `def self.x` and `class << self` bodies.
- Supers inside singleton context resolve against that ancestry; instance and
  singleton indexes never cross-resolve.
- Tests cover a resolvable singleton chain, a cross-ancestry non-resolution,
  and the existing instance-side behaviour unchanged.
