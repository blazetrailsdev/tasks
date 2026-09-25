---
title: "relation-create-with-nested-attributes"
status: done
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8078
claim: "2026-09-25T03:11:52Z"
assignee: "assertions-mysql-legacy-migration-engine-innodb-option"
blocked-by: null
closed-reason: null
---

## Context

Surfaced converging `relations_test.rb` assertions (assertions-relations-test, RFC 0132). The converged test is parked `it.skip` in `packages/activerecord/src/relations.test.ts`: **"create with nested attributes"**.

- Rails: activerecord relations_test.rb:1695 (Developer.where(name:).create_with(projects_attributes: [...]).create!)
- trails: packages/activerecord/src/relation.ts scopeForCreate / createWith
- Observed: UnknownAttributeError: unknown attribute projects_attributes for Developer

## Acceptance criteria

- The parked test in `relations.test.ts` is un-skipped (its BLOCKED line removed) and passes with its Rails assertions unchanged.
- The behaviour matches the Rails source cited above, method by method.
