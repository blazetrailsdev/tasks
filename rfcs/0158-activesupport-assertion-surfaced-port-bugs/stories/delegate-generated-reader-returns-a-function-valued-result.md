---
title: "activesupport: a delegate-generated reader returns a function-valued result, so core.rb:37's delegate ports through delegate()"
status: draft
updated: 2026-10-02
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
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

`ActiveRecord::Core` declares `delegate :destroy_association_async_job, to: :class`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/core.rb:37`). trails#8384 could not port it through
`delegate()` and hand-defines a prototype getter in `Core`'s `included` hook
(`packages/activerecord/src/core.ts:78-83`).

The blocker is in `Delegation.generate` (`packages/activesupport/src/delegation.ts:128-138`, Rails'
`vendor/rails/v8.0.2/activesupport/lib/active_support/delegation.rb:21`). The generated method ends with

    const member = _[method];
    return typeof member === "function" ? member.apply(_, args) : member;

so a delegated reader whose VALUE is a function is called instead of returned. A class is a function,
and `destroy_association_async_job` answers a job class, so the delegate would invoke the job's
constructor without `new`. `receiverValue` in the same file (`:22-36`) already tells a method from an
accessor by reading the property descriptor (`"value" in descriptor`); the generated method does not.

Second gap: the delegate is always generated as a method, so the instance side would be
`record.destroyAssociationAsyncJob()` where the class side is a getter. CLAUDE.md § "Generated attribute
readers are properties" is the rule for a zero-arg reader.

## Acceptance criteria

- [ ] A `delegate`-generated member whose target member is an accessor (or a data property that is not a method the target's class defines) returns the value without calling it, decided from the descriptor as `receiverValue` does.
- [ ] `core.ts` ports `core.rb:37` as `delegate.call(base.prototype, "destroyAssociationAsyncJob", { to: "class" })` and the hand-defined prototype getter is deleted.
- [ ] `core.trails.test.ts`'s "\_destroy_association_async_job defaults to Rails' job name…" still passes: `new Child().destroyAssociationAsyncJob` answers the job class.
