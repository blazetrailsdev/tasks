---
title: "Port mime_type_test.rb's remainder and permissions_policy_test.rb under Rails names"
status: draft
updated: 2026-09-27
rfc: "0164-actiondispatch-http-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "mime-type-invented-constants-and-invalid-type-parent",
    "port-actionpack-abstract-unit-test-support",
  ]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

- `vendor/rails/v8.0.2/actionpack/test/dispatch/mime_type_test.rb`:
  `MimeTypeTest` (`:6-275`) is 27/32. Missing: "custom type with url
  parameter", "custom type with extension aliases", "can be initialized with
  parameters without having space after ;", "invalid mime types raise error",
  "holds a reference to mime symbols". Six trails tests have no Rails
  counterpart.
- `vendor/rails/v8.0.2/actionpack/test/dispatch/permissions_policy_test.rb`:
  3/12. `PermissionsPolicyTest` (`:10-35`, 5 missing),
  `PermissionsPolicyIntegrationTest` (`:168-178`, 3) and
  `PermissionsPolicyWithHelpersIntegrationTest` (`:250`, 1).
  `dispatch/permissions-policy.test.ts` spells nine names as raw Ruby methods
  (`it("test_mappings")`); `scripts/test-compare/extract-ruby-tests.rb:691`
  derives `"mappings"`. Re-spelling is convergence, not a rename.

## Acceptance criteria

- The five mime tests are ported; the six extras move to
  `http/mime-type.trails.test.ts` (it exists) or are deleted.
- The nine permissions-policy tests carry their extractor names and Rails
  bodies, including the two integration classes.
- Both files report complete with no extra.
