---
title: "activemodel: ActiveModel::API#initialize joins the host constructor chain (blocked on a constructor hook)"
status: blocked
updated: 2026-10-05
rfc: "0123-blocked-convergence-holding"
cluster: skips
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: "TS language: a class body must carry its own constructor, and include() cannot install one. The construction hook this story waited on exists (ruby-compat initializeIncludedModules, trails#7590; ActiveModel::API#initialize calls it at activemodel api.ts:21-25 and Model's constructor enters initialize since trails#8439), so what remains is Model's hand-written constructor (@missingRailsCall assign_attributes, model.ts:122) and the api.rb initialize entry in SCOPED_SKIP_GROUPS (scripts/parity/conventions.ts:858-873). Deleting those needs either a CLAUDE.md ratification of the module-initialize spelling or a scorer that maps a module's initialize to something other than a constructor; neither is decided."
closed-reason: null
---

## Context

`SCOPED_SKIP_GROUPS[14]` exempts `ActiveModel::API#initialize` (`vendor/rails/v8.0.2/activemodel/lib/active_model/api.rb:78-81`): in Ruby it is an
`initialize` on a Concern that joins the including class's constructor chain through `super`. trails
keeps it as an exported `initialize` function each including class calls from its own constructor
(`packages/activemodel/src/model.ts`), because `include()` (`packages/ruby-compat/src/include.ts`)
copies prototype members and cannot install a constructor.

This is not ratified in CLAUDE.md. The honest state is blocked until ruby-compat grows a way to
splice a module's `initialize` into a class's construction (the same gap as
`activerecord-fixture-initialize-prepend-constructor` and `ActiveSupport::Messages::Rotator#initialize`).

## Acceptance criteria

- [ ] ruby-compat's `include()` (or a sibling) can run a module's `initialize` inside the host's construction, in Ruby's ancestor order, and `ActiveModel::API` uses it.
- [ ] `SCOPED_SKIP_GROUPS[14]` is deleted and `api.rb#initialize` is scored.

## Verification

```bash
pnpm parity:api && pnpm parity:api:pins && pnpm vitest run scripts/parity/conventions.test.ts
```
