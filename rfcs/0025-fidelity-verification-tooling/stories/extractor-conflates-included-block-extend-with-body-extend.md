---
title: "extractor conflates `included do extend X end` with a module body `extend X`"
status: draft
updated: 2026-08-26
rfc: "0025-fidelity-verification-tooling"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The Ruby extractor records a module's `extend` list as one flat array, with no
mark separating a body-level `extend` from one written inside the Concern's
`included do … end` block. The two have opposite propagation in Ruby:

- `module M; extend Namer; end` — `Namer` lands on `M`'s own singleton and
  reaches NO includer.
- `module M; extend ActiveSupport::Concern; included do extend Namer end; end`
  — `base.class_eval(&@_included_block)`
  (`vendor/rails/activesupport/lib/active_support/concern.rb:138`) runs
  `extend Namer` on the INCLUDER, so every host answers `Namer`'s methods as
  class methods.

`vendor/rails/activemodel/lib/active_model/validations.rb:40-51` is the shape
that matters: `extend ActiveSupport::Concern` sits in the body while
`extend ActiveModel::Naming` / `ActiveModel::Callbacks` / `ActiveModel::Translation`
/ `HelperMethods` all sit inside `included do`. The extractor emits them as one
list, `['ActiveSupport::Concern', 'ActiveModel::Naming', …]`. Same in
`vendor/rails/activesupport/lib/active_support/callbacks.rb:64-70`
(`extend Concern` in the body, `extend ActiveSupport::DescendantsTracker`
inside `included do`).

PR #7099 needed the includer-propagating half in `collectAllowedNames`'s
`walkMixin` (`scripts/api-compare/extra-surface.ts`) and could only get it with
a heuristic: propagate a module's non-Concern `extends` to the includer IF the
module is a Concern. That is right for every instance in the vendored corpus —
checked — because a Concern that also body-`extend`s something other than
`Concern` itself does not appear there. It is still a guess standing in for a
fact the extractor already had and threw away, and a future Rails version that
writes one would silently over-allow.

## Acceptance criteria

- The Ruby extractor distinguishes the two, e.g. an `includedBlockExtends`
  array beside `extends`, populated from the `included do … end` body.
- `collectAllowedNames`'s `walkMixin` propagates `includedBlockExtends` to the
  includer unconditionally, and body `extends` never — retiring the
  is-it-a-Concern heuristic PR #7099 introduced along with its comment.
- `pnpm parity:api:extra` totals do not regress (they should be unchanged: the
  heuristic and the fact agree over today's corpus, which is the point of
  landing the fact before they diverge).
- `extractor-schema.test.ts` / `extract-ruby-api.test.ts` cover the split, with
  a fixture for each of the two shapes.
