---
title: "multiparameter-time-local-not-equal-to-time-local"
status: done
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8072
claim: "2026-09-25T01:04:13Z"
assignee: "migration-test-inline-adapter-branches"
blocked-by: null
closed-reason: null
---

## Context

Parked test: `multiparameter attributes on time` in `packages/activerecord/src/multiparameter-attributes.test.ts`, converged to Rails (`vendor/rails/activerecord/test/cases/multiparameter_attributes_test.rb:68-78`): under `with_timezone_config default: :local`, `topic.attributes = {written_on(1i..6i)}` then `assert_equal Time.local(2004, 6, 24, 16, 24, 0), topic.written_on`.

trails: `expect(topic.written_on).toEqual(RubyTime.local(2004,6,24,16,24,0))` fails with "Time{} deeply equal Time{}, no visual difference" (and `.valueOf()` comparison also fails). Cause not established; isolated to this test.

## Acceptance criteria

- The test is un-skipped with the converged body and passes.
