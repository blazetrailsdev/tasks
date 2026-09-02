---
title: "port-rack-request-form-pairs"
status: claimed
updated: 2026-09-02
rfc: "0133-rack-session-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 25
pr: null
claim: "2026-09-02T18:45:08Z"
assignee: "converge-env-for-symbol-opts-onto-colon-spelling"
blocked-by: null
closed-reason: null
---

## Context

`Request#formPairs` (`packages/rack/src/request.ts`) has no counterpart in the
vendored Rack (`vendor/rack/lib/rack/request.rb` defines no `form_pairs`; the
constant `RACK_REQUEST_FORM_PAIRS` is seated by `POST` at `:528` and read
nowhere else). Rack 3.2 adds a public `Rack::Request::Helpers#form_pairs`; the
vendored gem predates it.

`converge-rack-request-get-post-params-cluster` (#7348) converged `POST` so it
seats `rack.request.form_pairs` through `expand_param_pairs`, and re-derived
`formPairs` from what `POST` seats — reading `RACK_REQUEST_FORM_PAIRS`, else
splitting `RACK_REQUEST_FORM_VARS` (`:537`) inline. The urlencoded arm is still
trails-shaped: Rack 3.2 answers it from a pair list `POST` seats for
urlencoded bodies too, rather than re-splitting `form_vars` at read time.

The method carries `@noRailsEquivalent CONVERGEABLE port-rack-request-form-pairs`
pointing at this story. `packages/actionpack/src/action-dispatch/http/request.ts`
(`requestParametersList`, `:1104-1116`) reads the same two env keys directly and
should be checked against Rails' `request_parameters_list` in the same pass.

## Acceptance criteria

- `vendor/rack` is bumped to a Rack that defines `form_pairs`, or the method is
  ported against that Rack's source and cited `file:line`.
- The inline `form_vars` split in `formPairs` is gone, replaced by whatever the
  Ruby reads.
- The `@noRailsEquivalent` receipt is removed once the method has a Ruby
  counterpart.
- `parity:api` rack non-negative; `parity:api:extra --package rack` does not
  grow.
