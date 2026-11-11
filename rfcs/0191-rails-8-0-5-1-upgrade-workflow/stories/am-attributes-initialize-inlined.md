---
title: "ActiveModel::Attributes#initialize is inlined and tagged"
status: blocked
updated: 2026-11-11
rfc: "0191-rails-8-0-5-1-upgrade-workflow"
cluster: entry
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 40
priority: 1
pr: null
claim: "2026-11-11T16:58:08Z"
assignee: "am-attributes-initialize-inlined"
blocked-by: "Needs a gate change or an operator ruling. Rails' ActiveModel::Model (model.rb) defines no initialize, and no framework class in vendor/rails/v8.0.2 includes ActiveModel::Attributes. The only constructor that runs this segment today is trails Model's, behind the guard isModuleIncluded(new.target, Attributes) at packages/activemodel/lib/model.ts:145. Tagging it @inlinedFrom ActiveModel::Attributes#initialize (with or without API#initialize) makes compare.ts:6855 throw: '@inlinedFrom was never compared, no Rails initialize paired: activemodel/model.ts Model#constructor'. The gate only pairs a tag with the Rails class's own initialize, so no tag site can pass for an open-set module whose initialize is inlined behind a guard. Fix it in compare.ts (pair a guarded segment with the module's initialize directly), or rule how parity:api credits Attributes#initialize."
closed-reason: null
---

## Context

Found by the 8.0.2 entry check (trails `876804dd8b`): `parity:api` reports
`ActiveModel::Attributes#initialize` missing from activemodel's
`attributes.ts` (20/21).

Rails: `@attributes = self.class._default_attributes.deep_dup`, then
`super` (`vendor/rails/v8.0.2/activemodel/lib/active_model/attributes.rb:106-109`).
trails ports the sibling `initialize_dup`
(`packages/activemodel/lib/attributes.ts:28-31`), but no constructor
carries `@inlinedFrom ActiveModel::Attributes#initialize`. Attributes is
included by an open set of classes, so check which constructor(s) set
`_attributes` from `_defaultAttributes.deepDup()` today, and tag that
segment (or inline it where it is missing).

## Acceptance criteria

- [ ] Each constructor that runs Attributes' `initialize` has the segment at
      Ruby's `super` position and carries the `@inlinedFrom` tag.
- [ ] `parity:api` shows activemodel `attributes.rb` at 21/21, and
      `pnpm parity:api:inlined` is green.
