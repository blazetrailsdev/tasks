---
title: "thor-group-help-classifies-invocation-names"
status: draft
updated: 2026-11-02
rfc: "0212-trailties-port"
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

`Thor::Group.get_options_from_invocations` (`vendor/thor/v1.3.2/lib/thor/group.rb:172-195`) titles an option group with `value.respond_to?(:classify) ? value.classify : value`. In Rails, ActiveSupport patches `String#classify`, so the group prints `ActiveRecord options:`. `packages/thor/src/group.ts` keeps the `rbObjRespondTo(value, "classify")` arm, but a JS string never answers it and thor has no runtime dependency on activesupport, so the group prints `active_record options:`.

`test_help_with_inherited_options` (`vendor/rails/v8.0.2/railties/test/generators/resource_generator_test.rb:21`) is parked as `it.skip` in `packages/trailties/src/generators/rails/resource/resource-generator.test.ts` until this lands.

## Acceptance criteria

- `ResourceGenerator --help` prints `ActiveRecord options:` and `TestUnit options:`.
- "help with inherited options" runs un-skipped.
