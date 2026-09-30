---
title: "activemodel: ActiveModel::API#initialize joins the host constructor chain (blocked on a constructor hook)"
status: blocked
updated: 2026-09-30
rfc: "0173-activemodel-parity-100"
cluster: skips
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: "TS language: a class constructor chain is fixed at `extends` time; ruby-compat include()/prepend() copy prototype members and cannot install or wrap a constructor, and CLAUDE.md ratifies no alternative. Needs a ruby-compat construction hook designed first."
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
