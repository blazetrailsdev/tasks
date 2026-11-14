---
title: "reset-column-information-undefines-attribute-methods"
status: done
updated: 2026-11-14
rfc: "0234-no-void-promises"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10098
claim: "2026-11-14T18:18:10Z"
assignee: "promise-gate-counts-maybe-promise-returns"
blocked-by: null
closed-reason: null
---

## Context

Rails' `reset_column_information` (`vendor/rails/v8.0.2/activerecord/lib/active_record/model_schema.rb:525`) runs `([self] + descendants).each(&:undefine_attribute_methods)`. trails' `resetColumnInformation` (`packages/activerecord/lib/model-schema.ts`) omits it. Adding the call as-is (trails#10092 review) fails about 275 AR tests, because trails does not regenerate attribute methods lazily after `undefineAttributeMethods` (`packages/activerecord/lib/attribute-methods.ts:381`).

## Acceptance criteria

- [ ] `resetColumnInformation` calls `undefineAttributeMethods` on itself and its descendants, at Rails' position.
- [ ] Attribute methods are redefined on the next use, as `define_attribute_methods` does in Rails, so the AR suite stays green.
