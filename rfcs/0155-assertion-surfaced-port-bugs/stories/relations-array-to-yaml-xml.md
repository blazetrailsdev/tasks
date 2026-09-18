---
title: "relations-array-to-yaml-xml"
status: draft
updated: 2026-09-18
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced converging `relations_test.rb` assertions (assertions-relations-test, RFC 0132). The converged test is parked `it.skip` in `packages/activerecord/src/relations.test.ts`: **"to yaml", "to xml"**.

- Rails: activerecord relations_test.rb:79-88 (Bird.all.to_yaml, Bird.all.to_a.to_yaml, .to_xml)
- trails: packages/activerecord/src/relation.ts (Relation#toXml exists; Relation#toYaml and Array#toYaml/toXml do not)
- Observed: Bird.all().toYaml is not a function; Array#toXml is not a function

## Acceptance criteria

- The parked test in `relations.test.ts` is un-skipped (its BLOCKED line removed) and passes with its Rails assertions unchanged.
- The behaviour matches the Rails source cited above, method by method.
