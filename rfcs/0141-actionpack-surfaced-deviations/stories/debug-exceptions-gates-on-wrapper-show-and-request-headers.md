---
title: "DebugExceptions gates on wrapper.show?(request) and request headers, not constructor flags"
status: blocked
updated: 2026-09-26
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-09-26T16:22:10Z"
assignee: "asset-tag-helper-image-loading-and-decoding-mattrs"
blocked-by: "Gating on request headers needs something to put action_dispatch.show_exceptions / show_detailed_exceptions into the env. trailties has no Engine#call/build_request/env_config (engine-call-build-request-env-config, claimed elsewhere) and no Application#env_config (port-application-env-config-for-action-dispatch-keys). Without them every exception in a booted app escapes: application.test.ts 'renders the dev error page through DebugExceptions rather than an ad-hoc catch' goes red. Unblock once both land."
closed-reason: null
---

## Context

`packages/actionpack/src/action-dispatch/middleware/debug-exceptions.ts#call`
gates re-raising on a constructor flag: `if (!this.showExceptions) throw exception`.
Rails (`vendor/rails/actionpack/lib/action_dispatch/middleware/debug_exceptions.rb:39-46`)
builds `request = ActionDispatch::Request.new env` and gates on
`raise exception unless wrapper.show?(request)`. `ExceptionWrapper#show`
(`middleware/exception-wrapper.ts:287`) already reads
`action_dispatch.show_exceptions`. `render_exception` (`:58-76`) likewise reads
`request.get_header("action_dispatch.show_detailed_exceptions")`, where trails reads
`this.showDetailedExceptions`. The `showExceptions`, `showDetailedExceptions`, and
`responseFormat` constructor options are trails inventions: Rails'
`initialize(app, routes_app = nil, response_format = :default, interceptors = self.class.interceptors)`
takes the format positionally and nothing else.

## Acceptance criteria

- [ ] `call` constructs a Request and gates on `wrapper.show(request)`.
- [ ] `renderException` reads `action_dispatch.show_detailed_exceptions` from the request.
- [ ] The invented constructor options are removed; the tests set env headers the
      way `debug_exceptions_test.rb` does.
