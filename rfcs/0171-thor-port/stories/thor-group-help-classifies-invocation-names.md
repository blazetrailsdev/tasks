---
title: "thor-group-help-classifies-invocation-names"
status: in-progress
updated: 2026-11-05
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#9747
claim: "2026-11-05T17:06:26Z"
assignee: "system-testing-reaches-vite-and-vitest-from-published-source"
blocked-by: null
closed-reason: null
---

## Context

`Thor::Group.get_options_from_invocations` (`vendor/thor/v1.3.2/lib/thor/group.rb:172-195`) titles an option group with `value.respond_to?(:classify) ? value.classify : value`. In Rails, ActiveSupport patches `String#classify`, so the group prints `ActiveRecord options:`. `packages/thor/src/group.ts` keeps the `rbObjRespondTo(value, "classify")` arm, but a JS string never answers it and thor has no runtime dependency on activesupport, so the group prints `active_record options:`.

`test_help_with_inherited_options` (`vendor/rails/v8.0.2/railties/test/generators/resource_generator_test.rb:21`) is parked as `it.skip` in `packages/trailties/src/generators/rails/resource/resource-generator.test.ts` until this lands.

## Acceptance criteria

- `ResourceGenerator --help` prints `ActiveRecord options:` and `TestUnit options:`.
- "help with inherited options" runs un-skipped.
