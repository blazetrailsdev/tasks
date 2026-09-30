---
title: "test-case-setup-request-bypasses-assign-parameters"
status: draft
updated: 2026-09-30
rfc: "0141-actionpack-surfaced-deviations"
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

Rails' `ActionController::TestCase::Behavior#setup_request`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/test_case.rb:605-615`) routes the
per-call parameters through the test's route set:
`@routes.generate_extras(parameters.merge(controller: controller_class_name, action: action))`,
`generated_path(...)`, `query_parameter_names(...)`, then
`@request.assign_parameters(@routes, controller_class_name, action, parameters, generated_path, query_string_keys)`.
That is what puts GET params in `QUERY_STRING`, encodes non-GET params into `rack.input`
per `as:`, and sets `PATH_INFO` / `path_parameters`.

trails' `setupRequest` (`packages/actionpack/src/action-controller/test-case.ts`, after
trails#8275 made `process` rebuild from the held `TestRequest`) instead sets `PATH_INFO`
to `params.path ?? "/<action>"`, pre-seeds `request.parameters` with the raw hash, and
writes `action_dispatch.request.path_parameters` directly. `TestRequest#assignParameters`
is already ported in the same file but is never called from `process`.

The rest of `process` (`test_case.rb:512-552`) has these gaps:

- `check_required_ivars` (`:668-676`) is not ported. It needs `@routes` set, and most
  trails TestCase tests never set it.
- The `cookies.update(@request.cookies)` / `HTTP_COOKIE` / `action_dispatch.cookies`
  arm (`:520-523`) is missing.
- `process_controller_response`'s cookie-jar arm and `@response.prepare!` (`:634-641`)
  are missing.
- `controller_class_name` (`:554-556`) returns the class name rather than
  `anonymous` / `controller_path`.

Once these are ported, these `test-case.test.ts` skips become portable:

- `process with query string`
- `request format`
- `using as json with path parameters`
- `request state is cleared after exception`
- `request protocol is reset after request`

The controller-reuse half is `test-case-process-rebuilds-the-controller-instead-of-dispatching-it`.

## Acceptance criteria

- [ ] `setupRequest` calls `this.routes.generateExtras`, `generatedPath`,
      `queryParameterNames` and `this.request.assignParameters` as `test_case.rb:605-615` does.
- [ ] `checkRequiredIvars` is ported and called first in `process`.
- [ ] The cookie arms of `process` / `processControllerResponse` and `response.prepare!` are ported.
- [ ] `controllerClassName` matches `test_case.rb:554-556`.
- [ ] The five skipped tests above are un-skipped and pass.
