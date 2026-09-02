---
title: "port-rack-request-form-pairs"
status: blocked
updated: 2026-09-02
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 25
pr: null
claim: "2026-09-02T18:45:08Z"
assignee: "converge-env-for-symbol-opts-onto-colon-spelling"
blocked-by: "Blocked on a vendor/rack bump to 3.2, which is a project-level decision outside this bundle. vendor/sources.lock.json pins rack v3.1.14 (the Rack that Rails v8.0.2, the vendored rails anchor, targets); 3.1's request.rb defines no form_pairs, so the @noRailsEquivalent receipt cannot be removed and any port stays novel surface. Rack 3.2's form_pairs (request.rb:499-533) also restructures POST (:539-548) to delegate to it, dropping 3.1's RACK_REQUEST_FORM_INPUT memoization and stream-changed warn that trails' POST currently mirrors verbatim — so porting form_pairs alone would either duplicate the parse or diverge POST from the vendored anchor. Its parse arm reads query_parser.parse_query_pairs (:523), which neither vendored Rack 3.1 nor trails defines. Unblock by bumping the rack anchor (and re-baselining the package's parity scores) under its own story."
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
