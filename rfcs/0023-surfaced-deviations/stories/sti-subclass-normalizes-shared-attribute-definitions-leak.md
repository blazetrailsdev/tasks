---
title: "STI subclass normalizes/encrypts leaks decoration onto shared _attributeDefinitions"
status: ready
updated: 2026-07-06
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced during PR #4655 (converge-normalization-single-type-decoration). When
`normalizes` is declared on an STI subclass, trails' `applyPendingNormalizations`
(`packages/activemodel/src/model.ts`) and the immediate `decorateAttributes`
path mutate the STI base's SHARED `_attributeDefinitions` map — because
`model-schema.ts` sets `originatingHost._attributeDefinitions = baseDefs` (shared
reference) and `applyPendingNormalizations(originatingHost)` then decorates that
shared map. Net effect: a normalizer declared on one STI subclass can leak the
decorated cast type onto the STI base and its sibling subclasses.

Rails keeps this per-subclass: `normalized_attributes` is a `class_attribute`
and `_default_attributes` is memoized per class walking that class's own pending
decorator chain (`vendor/rails/activerecord/lib/active_record/normalization.rb`,
`vendor/rails/activemodel/lib/active_model/attribute_registration.rb`), so a
subclass `normalizes` does not affect the base or siblings.

This mirrors the EXISTING `applyPendingEncryptions(originatingHost)` behavior in
`model-schema.ts` (encrypts on an STI subclass has the same shared-defs leak), so
the fix likely generalizes to both: give STI subclasses a per-subclass overlay
for attribute-type decorations rather than mutating the shared base map. Not
exercised by any current test (the normalized-attribute suite uses non-STI
`NormalizedAircraft extends Aircraft`), hence latent.

## Acceptance criteria

- [ ] `normalizes` (and, ideally, `encrypts`) declared on an STI subclass decorates
      only that subclass's attribute types — the STI base and sibling subclasses
      keep the undecorated (or their own) cast type.
- [ ] Add an STI-subclass normalization test proving the base/sibling is unaffected
      (mirror a Rails STI + normalizes scenario if one exists; otherwise a minimal
      canonical-model case).
- [ ] No regression to non-STI normalization (normalized-attribute.test.ts stays green).
