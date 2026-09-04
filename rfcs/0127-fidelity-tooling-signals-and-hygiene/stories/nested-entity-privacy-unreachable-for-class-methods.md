---
title: "A nested Rails entity's private CLASS method is still unreachable through the file-wide fold"
status: ready
updated: 2026-09-04
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #7471 added `entityInstanceFiles` to `eslint/rails-private-methods.json` — the
privates fold run per Ruby entity rather than per file — so a nested entity's
private member survives a sibling entity publishing the same name in the same
`.rb`. That is what let `LoaderRecords#loadRecords` / `#loaderQuery` carry
`@internal` while `Association`'s public `#load_records` (`:197`) / `#loader_query`
(`:165`) stayed untagged
(`vendor/rails/activerecord/lib/active_record/associations/preloader/association.rb:76,:91`,
under the `private` at `:75`).

It covers the INSTANCE halves only. `build-rails-privates-manifest.ts` populates
`entityInstanceVis` inside the `for (const ent of instance)` loop, guarded by
`!isClassMethodsHalf` — the same guard `noteInstance` carries. The class-method
side (`for (const ent of klass)`, plus `host.classMethods`) still notes into the
file-wide `fileVis` alone, so a nested entity's private CLASS method remains
unreachable in exactly the way the instance side was before #7471: any sibling
entity in the same `.rb` that publishes the name folds it out, and the reverse
rule `blazetrails/unbacked-internal-needs-receipt` then refuses the `@internal`
with no remedy but a `@noRailsEquivalent` receipt that would be a false claim.

This was scoped out of #7471 deliberately, not overlooked. A per-entity
class-method fold keyed the same way (last FQN segment) would demand `@internal`
on members a nested `ClassMethods` module publishes: `ancestorsFor(host)` pushes
a `ClassMethods` module only for the host's _includes_, never the host's own
nested one, so `ActiveModel::Attributes` would fold its private instance
`attribute` (`activemodel/lib/active_model/attributes.rb:161`) without
`Attributes::ClassMethods`' public one (`:59`) — reintroducing PR #7057's
over-tagging on the static side. The instance fold escapes this because
`isClassMethodsHalf` excludes the `ClassMethods` host from it entirely.

No confirmed instance is in hand; the first job is to find one (or to establish
there is none and close this, which is a legitimate outcome).

## Acceptance criteria

- Establish whether a nested Rails entity declares a private/protected CLASS
  method whose name a sibling entity in the same `.rb` publishes, and whose TS
  port is a static member. Cite the Rails `file:line` pair. If no instance
  exists, close the story with that finding rather than building the fold.
- If one exists: the manifest carries the class-method twin of
  `entityInstanceFiles`, and `rails-private-jsdoc` /
  `unbacked-internal-needs-receipt` consult it for a STATIC member the same way
  they consult `entityInstanceFiles` for an instance member — additively, after
  the file-wide `files` union, never subtractively.
- A host's own nested `ClassMethods` module contributes to its class-method fold,
  so `ActiveModel::Attributes`' static `attribute` stays untagged
  (`attributes.rb:59` public vs `:161` private). Assert it as a rule-test case.
- `pnpm lint` and CI's
  `eslint --no-inline-config --config eslint/rails-private-jsdoc.config.mjs packages`
  stay clean; `pnpm parity:api:extra:gate` stays green.
