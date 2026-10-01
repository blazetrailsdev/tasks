---
title: "nested attributes: restore the permitted? arm on the one-to-one assigner"
status: draft
updated: 2026-10-01
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`assign_nested_attributes_for_one_to_one_association`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/nested_attributes.rb:423-427`) opens with

    if attributes.respond_to?(:permitted?)
      attributes = attributes.to_h
    end

before its `is_a?(Hash)` check. The port
(`packages/activerecord/src/nested-attributes.ts`, `assignNestedAttributesForOneToOneAssociation`)
goes straight to the type check, so an `ActionController::Parameters` value is read as a plain
object. PR 8357 restored the same arm on the collection twin
(`assignNestedAttributesForCollectionAssociation`) as
`rbObjRespondTo(attributesCollection, "permitted")` followed by `.toH()`.

## Acceptance criteria

- [ ] The one-to-one body takes the `respond_to?(:permitted?)` arm before the Hash check, spelled as the collection twin spells it.
- [ ] A trails-only test passes a permitted-params-shaped object (a `permitted` member and `toH`) through `setShipAttributes` and fails on the current body.
