---
title: "rbFBinding resolves top-level constants without returning a Proxy over self"
status: draft
updated: 2026-11-04
rfc: "0221-no-returned-proxies"
cluster: factory-returned
packages: ["ruby-compat", "activerecord", "rack", "thor", "trailties"]
deps: ["no-returned-proxy-lint-gate"]
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

trails:

- `packages/ruby-compat/src/variable.ts:88`
- `callers: packages/activerecord/src/fixture-set/render-context.ts:12, packages/rack/src/builder.ts:19, packages/thor/src/actions/file-manipulation.ts:125, packages/trailties/src/command/base.ts:177, packages/trailties/src/generators/active-record/migration/migration-generator.ts:104`

Rails / Ruby:

- `vendor/ruby/v3.3.11/proc.c:376` (`rb_f_binding`)

A binding is a scope, not `self`; template evaluation can take `self` and the constant table as two arguments instead of one merged Proxy. Decide the shape against the precompiled-template contract (packages/actionview/CLAUDE.md, "Templates are precompiled").

See the RFC README for why a returned Proxy is the defect, and trails#9572 for
the first prototype-chain conversion of an instance-level dispatch.

## Acceptance criteria

- [ ] `rbFBinding` returns no Proxy. The binding's `self` and its constant
      table are passed as separate values, or the binding is a real object
      whose prototype chain reaches the constant table.
- [ ] For each of the five callers in Context, a test evaluates a template
      against the binding and asserts both that a member of `self` is read
      (the template's `this` `===` the caller's object) and that a top-level
      constant seated on `TopLevel` resolves.
- [ ] A name that is both a member of `self` and a top-level constant resolves
      to the member, as `key in target` did before.
- [ ] This site's row in the `no-returned-proxy-lint-gate` list is deleted,
      and `rbFBinding` leaves the rule's helper list.
