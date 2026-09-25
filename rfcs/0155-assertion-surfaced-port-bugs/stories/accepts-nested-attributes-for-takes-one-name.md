---
title: "acceptsNestedAttributesFor takes one association name where Rails takes *attr_names"
status: claimed
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-09-25T18:51:40Z"
assignee: "initialize-cache-skips-lookup-store-so-generated-cache-store-is-omitted"
blocked-by: null
closed-reason: null
---

## Context

Rails `accepts_nested_attributes_for(*attr_names)` (`vendor/rails/activerecord/lib/active_record/nested_attributes.rb:351`) takes any number of association names plus one trailing options hash, e.g. `Pirate.accepts_nested_attributes_for(:birds_with_add_load, :birds_with_add, allow_destroy: true)` (`activerecord/test/cases/nested_attributes_with_callbacks_test.rb:18-20`), and `pirate.rb:50,53-54` names several associations per call.

trails' `acceptsNestedAttributesFor(modelClass, associationName, options)` (`packages/activerecord/src/nested-attributes.ts:32`) and `Base.acceptsNestedAttributesFor(associationName, options)` (`packages/activerecord/src/base.ts:1055`) take a single name. So every multi-name call is split, as in `nested-attributes-with-callbacks.test.ts` (trails#8072) and `test-helpers/models/pirate.ts:170-177`.

## Acceptance criteria

- Both entry points take `...attrNames` followed by an optional options hash, the port of `attr_names.extract_options!` followed by `attr_names.each`, with the same per-name body.
- The split calls in `nested-attributes-with-callbacks.test.ts` and the canonical models (`pirate.ts`, and any others mirroring a multi-name Rails call) collapse back to the Rails call shape.
