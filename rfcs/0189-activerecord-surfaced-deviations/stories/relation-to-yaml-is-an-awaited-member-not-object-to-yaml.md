---
title: "Relation#toYaml is an awaited member that loads first; Rails' is Object#to_yaml"
status: closed
updated: 2026-10-18
rfc: "0189-activerecord-surfaced-deviations"
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
closed-reason: "Operator triage 2026-10-18 (RFC 0189 refine): all parity axes at 100%; this is structural/shape fidelity with no user-observable behavior change — not worth pursuing. Closed as won't-fix."
---

## Context

Rails' `Bird.all.to_yaml`
(`vendor/rails/v8.0.2/activerecord/test/cases/relations_test.rb:79-82`) is
Psych's `Object#to_yaml` (`vendor/ruby/v3.3.11/ext/psych/lib/psych/core_ext.rb:12-14`),
which reaches `Relation#encode_with`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/relation.rb:348-350`), and
that reads `records`, loading the relation in line.

trails#8838 ported `Relation#encodeWith` over the loaded records and added an
awaited `Relation#toYaml` member that loads first, because `Psych.dump` is
synchronous and cannot await the query. A direct `YAML.dump(relation)` of an
unloaded relation therefore emits an empty sequence. `toYaml` carries
`@noRailsEquivalent CONVERGEABLE` naming this story.

## Acceptance criteria

- [ ] The repo owner rules on the shape: an awaited `Relation#toYaml` member
      (then the receipt is `PERMANENT` under activerecord CLAUDE.md
      § "`Relation` is evaluated by an async query"), or another.
- [ ] `YAML.dump` of an unloaded relation does not silently emit `[]`.
