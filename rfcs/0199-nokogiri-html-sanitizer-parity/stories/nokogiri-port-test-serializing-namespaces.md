---
title: "Port nokogiri v1.19.7 test_serializing_namespaces.rb"
status: ready
updated: 2026-11-26
rfc: "0199-nokogiri-html-sanitizer-parity"
cluster: null
packages: []
deps:
  - nokogiri-xml-builder
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

nokogiri v1.19.7 adds `test/namespaces/test_serializing_namespaces.rb`
(`vendor/nokogiri/v1.19.7/test/namespaces/test_serializing_namespaces.rb`),
11 tests in the `serializing namespaces` describe. They cover not repeating xmlns
declarations on children, redeclaring them when shadowed, default namespaces,
several declarations per element, prefix reuse with different URIs, and
inheritance across levels. trails has no
`packages/nokogiri/test/namespaces/test-serializing-namespaces.test.ts`. The
nokogiri 1.19.7 burn-down (trails#10813) recorded these as not ported.

## Acceptance criteria

- [ ] `test/namespaces/test-serializing-namespaces.test.ts` ports all 11 tests
      with Rails names verbatim.
- [ ] Any XML serializer divergence they expose (`xml/node.ts` `toXml` /
      namespace reconciliation) is converged, or the test is parked with its
      reason.
