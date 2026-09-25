---
title: "topic-open-replies-scope"
status: claimed
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: "2026-09-25T16:51:41Z"
assignee: "generated-environments-omit-namespaced-framework-settings"
blocked-by: null
closed-reason: null
---

## Context

Surfaced converging `relations_test.rb` assertions (assertions-relations-test, RFC 0132). The converged test is parked `it.skip` in `packages/activerecord/src/relations.test.ts`: **"relation with private kernel method"**.

- Rails: activerecord/test/models/topic.rb:51 (has_many :open_replies, -> { open }, class_name: "Reply", foreign_key: "parent_id")
- trails: packages/activerecord/src/test-helpers/models/topic.ts:127
- Observed: hasMany("openReplies") is declared without the -> { open } scope, so it returns every reply

## Acceptance criteria

- The parked test in `relations.test.ts` is un-skipped (its BLOCKED line removed) and passes with its Rails assertions unchanged.
- The behaviour matches the Rails source cited above, method by method.
