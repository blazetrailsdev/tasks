---
title: "rack-test residual: Methods alias and accessor, four missing tests, one skip, call and argument rows, pins"
status: draft
updated: 2026-10-15
rfc: "0193-small-gem-ports-parity-100"
cluster: small-residuals
packages: [rack-test]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

- `methods.rb` is 22/25. `alias rack_mock_session rack_test_session` (`vendor/rack-test/v2.2.0/lib/rack/test/methods.rb:37`) is a module-private `const` in `packages/rack-test/src/methods.ts:30`, never placed on the module. `attr_accessor :_rack_test_current_session` (`:90-91`, private) exists only as a `MethodsHost` interface declaration.
- Missing tests in `test_spec.rb`: "has alias of Rack::MockSession for backwards compatibility", "supports a Rack::Response", "closes response's body when body responds_to?(:close)", "closes response's body after iteration when body responds_to?(:close)". `uploaded_file_spec.rb` has 1 skip.
- Call row: `cookie_jar.rb for` omits `new` (shard `rack-test/cookie-jar.json`).
- Argument rows (naming): `cookie_jar merge` (`_defaultHost`), `test.rb request` (`parsedUri`), `env_for` (`cookie`→`delete`), `process_request` (`rackBody`→`body`).
- Pins: 64/67.

## Acceptance criteria

- [ ] rack-test 108/108 methods, 234/234 tests, and pins 0 unpinned.
- [ ] 0 rack-test rows in either mismatch output; the `cookie-jar.json` shard is deleted and tightened.
