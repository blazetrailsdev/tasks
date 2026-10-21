---
title: "activerecord: Base include order follows base.rb"
status: draft
updated: 2026-10-21
rfc: "0189-activerecord-surfaced-deviations"
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

`ActiveRecord::Base` includes its modules in a fixed order (`vendor/rails/v8.0.2/activerecord/lib/active_record/base.rb:283-332`), and that order decides which module's method answers when two define the same name. In `packages/activerecord/src/base.ts` the `include(Base, …)` / `extend(Base, …)` calls follow a different order. For example, `_Reflection.Reflection` is included before `AMDirty` / `_Dirty`, whereas `base.rb:314` (`AttributeMethods`) comes before `:324` (`Reflection`) and `:325` (`Serialization`).

The order never mattered while the modules were ruby-compat `Module` carriers. Since RFC 0197 they are plain-object modules, where a later include outranks an earlier one, so the order is observable. trails#9178 found this when Dirty's `as_json` shadowed `Serializers::JSON#as_json`. It moved only `Serializers::JSON` plus AR's `serializable_hash` (`serialization.rb:5-20`) after `_AttrSerialization`, and not after `Reflection`, where `base.rb:325` puts it.

## Acceptance criteria

- The `include(Base, …)` sequence in `base.ts` follows `base.rb:283-332`. Where a module has no single TS include, its members are installed at its Rails position.
- `Serializers::JSON` and AR `serializable_hash` sit at `base.rb:325`, after `Reflection`.
- The activerecord suite stays green.
