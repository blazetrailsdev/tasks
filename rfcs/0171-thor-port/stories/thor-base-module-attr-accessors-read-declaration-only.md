---
title: "Thor::Base options / parent_options / args are real accessors on the module, not interface declarations"
status: draft
updated: 2026-10-04
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/thor/v1.3.2/lib/thor/base.rb:36` is `attr_accessor :options, :parent_options, :args` on `module Base`.

`packages/trailties/src/thor/base.ts` (trails#8464) declares the three as fields of `interface Base` only, so
`parity:api --package thor` lists `options`, `options=`, `parent_options`, `parent_options=`, `args` and `args=`
as `[declaration-only]`, and `base.rb` reads 63/70 after trails#8469. The seventh, `initialize`, is
`parity-api-credits-module-initialize-hook`.

## Acceptance criteria

- [ ] The three accessors are defined on the `Thor::Base` module the way a module `attr_accessor` is ported
      elsewhere, so an including class gets them from the module.
- [ ] `parity:api --package thor --missing` lists none of the six for `base.rb`.
