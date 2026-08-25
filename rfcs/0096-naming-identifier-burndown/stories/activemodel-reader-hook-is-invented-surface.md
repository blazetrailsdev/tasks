---
title: "ActiveModel's define_method_attribute reader hook is invented surface"
status: done
updated: 2026-08-19
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 6737
claim: "2026-08-19T12:59:17Z"
assignee: "wave-4c-ar-core-residue-transactions-and-core"
blocked-by: null
closed-reason: null
---

## Context

PR #6717 added `defineMethodAttribute` to
`packages/activemodel/src/attribute-methods.ts`, carrying
`@noRailsEquivalent PERMANENT`, plus its helper `isDefinedByAClassBody`.

ActiveModel has no such hook. For a plain `ActiveModel::Attributes` includer,
`respond_to?("define_method_attribute", true)` is false, so
`define_attribute_method_pattern`
(`vendor/rails/activemodel/lib/active_model/attribute_methods.rb:333-346`) takes
the `else` arm and `define_proxy_call` generates an ordinary method —
`def name; attribute("name"); end` — dispatching to the private instance method
`attribute(attr_name)` (`activemodel/lib/active_model/attributes.rb:161`). Only
ActiveRecord defines the hook (`activerecord/lib/active_record/attribute_methods/read.rb:11`).

trails needs it because a trails attribute reader is an accessor property
(`person.name`, not `person.name()`), which `define_proxy_call` cannot emit. The
same deviation forces `isDefinedByAClassBody`: Rails is free to let a generated
reader shadow an inherited `to_json`, since a Ruby reader is an ordinary method
and nothing in the runtime depends on `to_json` staying callable, whereas a
generated `toJSON` accessor breaks `JSON.stringify` (pinned by
"attribute named toJSON does not shadow Model#toJSON").

## Converged shape

Either:

- make the bare pattern's generated ActiveModel reader an ordinary method routed
  through `define_proxy_call` against a ported private instance
  `attribute(attrName)` (attributes.rb:161), and move trails' property-shaped
  reader to a layer that is explicitly not the Rails port; or
- establish, as a documented repo-wide rule with its own register entry, that a
  Ruby zero-arg reader ports as a getter and that ActiveModel therefore needs a
  generation hook ActiveRecord already has — in which case this story closes by
  moving the deviation into that register rather than by keeping a per-call-site
  tag.

Either way the outcome is one decision, applied once, instead of an invented
hook justified locally.

## Acceptance criteria

- [ ] `activemodel/attribute-methods.ts` carries no `@noRailsEquivalent` hook
      whose only justification is "a trails reader is a property", or that
      justification lives in a repo-wide register that other ports cite too.
- [ ] `isDefinedByAClassBody` is either unnecessary or is the documented
      consequence of that same rule.
- [ ] "attribute named toJSON does not shadow Model#toJSON" and the ActiveModel
      attribute-methods suites still pass.
