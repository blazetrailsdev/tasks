---
title: "Thor::Base#initialize writes @args, not the args= writer"
status: draft
updated: 2026-10-05
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Thor::Base#initialize` ends with an ivar write, `@args = thor_args.remaining`
(`vendor/thor/v1.3.2/lib/thor/base.rb:113`), while it sets options through the writer,
`self.options = opts.parse(array_options)` (`base.rb:93-94`).

`packages/trailties/src/thor/base.ts` ports both as accessor writes: `this.args = thorArgs.remaining()`.
Since trails#8541 the three `attr_accessor` members (`base.rb:36`) are real module accessors over the
`_options` / `_parentOptions` / `_args` ivars, so the ivar write has a slot to land in. The two
spellings store the same value today; they diverge for a class that overrides the `args=` writer.

## Acceptance criteria

- [ ] `initialize` writes `this._args = thorArgs.remaining()`, with `_args` typed on `interface Base`
      the way the module's other ivars are typed.
- [ ] `this.options = …` stays a writer call, as `base.rb:93-94` is.
- [ ] `parity:api --package thor` and `parity:api:extra:gate` are unchanged.
