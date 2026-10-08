---
title: "audit: sort Rails' inherited hooks into bodies written elsewhere and bodies replaced by another mechanism"
status: draft
updated: 2026-10-08
rfc: "0186-module-initialize-inlined-into-constructors"
cluster: tooling
packages: ["scripts"]
deps: ["claude-md-section-for-inlined-module-initialize"]
deps-rfc: []
est-loc: 0
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0186 holds `inherited` as a candidate third entry for `@inlinedFrom`'s
closed list. JS has no hook that fires when a subclass is defined (trails
CLAUDE.md § "`inherited` is deferred to own-property memo guards"), so each
Rails `inherited` body is deferred somewhere else.

`rails-api.json` lists 32 definitions: 9 as class methods (for example
`ActiveRecord::Migration`, `migration.rb:617`; `ActionController::Metal`,
`metal.rb:146`; `AbstractController::Base`, `base.rb:62`) and 23 as instance
methods of `ClassMethods` modules (for example
`ActiveRecord::AttributeMethods::ClassMethods`, `attribute_methods.rb:265`;
`ActiveRecord::Core::ClassMethods`, `core.rb:409`).

Known shapes in trails, from CLAUDE.md: `ModelSchema.inherited` is replaced by
the `ownSchemaMemo` guard; `ParamsWrapper::ClassMethods#inherited` is a ported
body (`inheritedParamsWrapper`) run from a first-read wrapper;
`Validations::ClassMethods#inherited` copies at a subclass's first
`_validators` read; `Callbacks`' subclass registration is seated on first own
write.

## Acceptance criteria

- A table of all 32: the Rails `file:line`, where the trails body lives, and
  one of three verdicts: body written inside another declaration; body kept as
  a named function run from a deferral point; replaced by a different
  mechanism with no lines to compare.
- A recommendation on whether `inherited` joins the closed list, and for which
  verdict.
- If it does, stories are filed for the lint change and the tagging; this
  story changes no code.
