---
title: "Audit tests for camelCase action names the failure-driven sweep could not see"
status: closed
updated: 2026-10-10
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: "2026-10-10T17:09:39Z"
assignee: "load-async-null-executor-arm-floats-its-load-under-the-adapter-lock"
blocked-by: null
closed-reason: 'FALSIFIED: the premise (action_name is the Rails snake_case name, per trails#8573) was reversed by trails#8640. packages/actionpack/CLAUDE.md § "An action''s name is its method''s name" now rules that an action goes by its method''s camelCase name everywhere, so a camelCase action name in a test is the correct spelling and there is nothing to sweep.'
---

## Context

Since trails#8573, `action_name` is the Rails name (`hello_world`): `AbstractController::Base#process` stores `action.to_s` unchanged (`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/base.rb:152-162`), `action_methods` answers Rails names, and `method_for_action` (`:284-290`) maps the name to the JS method. A JS-spelled name (`helloWorld`) is an unknown action.

The caller sweep in that PR was driven by test failures: a call site was converted when the test went red. A camelCase action name that does not make its test fail was not found. Candidates are a name that never reaches dispatch (`url_for({ action: "fooBar" })`, `assert_generates` / `assert_recognizes` hashes, `params[:action]` expectations built from the same literal on both sides), a controller with `actionMissing`, a route whose action is only asserted as a string, and skipped tests. The sweep covered test files under `packages/actionpack/src`, `packages/actionview/src`, `packages/trailties/src` and `packages/website/src` that mention `Controller`; other packages and non-`.test.ts` fixtures were only grepped for `only:` / `except:`.

## Acceptance criteria

- [ ] Every action name in a test or fixture under `packages/**` is the name the mirrored Rails test uses (`hello_world`), including `action:` hash values, `controller#action` strings, URL path segments derived from an action, and skipped tests.
- [ ] A grep for a camelCase string literal that equals a controller method name in the same file returns only JS method references (callback names, `rbFSend` targets), not action names.
