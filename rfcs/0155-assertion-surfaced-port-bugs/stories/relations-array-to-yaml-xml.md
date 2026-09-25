---
title: "relations-array-to-yaml-xml"
status: closed
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8086
claim: "2026-09-25T14:31:42Z"
assignee: "relation-find-by-bang-no-arguments"
blocked-by: null
closed-reason: "Split: to_xml half converged in trails#8086 (Relation#toXml delegates to Array#to_xml); to_yaml half needs a Psych emitter and is tracked as relation-to-yaml-psych-dump."
---

## Context

Surfaced converging `relations_test.rb` assertions (assertions-relations-test, RFC 0132). The converged test is parked `it.skip` in `packages/activerecord/src/relations.test.ts`: **"to yaml", "to xml"**.

- Rails: activerecord relations_test.rb:79-88 (Bird.all.to_yaml, Bird.all.to_a.to_yaml, .to_xml)
- trails: packages/activerecord/src/relation.ts (Relation#toXml exists; Relation#toYaml and Array#toYaml/toXml do not)
- Observed: Bird.all().toYaml is not a function; Array#toXml is not a function

## Acceptance criteria

- The parked test in `relations.test.ts` is un-skipped (its BLOCKED line removed) and passes with its Rails assertions unchanged.
- The behaviour matches the Rails source cited above, method by method.
