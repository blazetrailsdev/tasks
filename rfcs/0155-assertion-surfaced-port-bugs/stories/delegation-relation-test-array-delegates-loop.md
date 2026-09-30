---
title: "DelegationRelationTest omits the ARRAY_DELEGATES loop over Comment.all"
status: done
updated: 2026-09-30
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#8277
claim: "2026-09-30T13:06:35Z"
assignee: "anonymous-migration-class-name-is-empty-string-not-nil"
blocked-by: null
closed-reason: null
---

## Context

Rails' `DelegationRelationTest` (`vendor/rails/v8.0.2/activerecord/test/cases/relation/delegation_test.rb`) does `include DelegationTests`, so the `ARRAY_DELEGATES` respond_to loop (`:10-24`) runs against `Comment.all` as well as against `post.comments`. trails' `packages/activerecord/src/relation/delegation.test.ts` ports the loop only under `DelegationAssociationTest`; its `DelegationRelationTest` block has only the `sort` test.

## Acceptance criteria

- `DelegationRelationTest` in `delegation.test.ts` runs the same `delegates <method> to Array` loop over `Comment.all()`, with Rails' names verbatim.
- Any name a plain `Relation` fails to answer is fixed in `relation.ts`, not skipped (`to_yaml` excepted until `psych-object-protocol-for-record-yaml-round-trip` lands).
