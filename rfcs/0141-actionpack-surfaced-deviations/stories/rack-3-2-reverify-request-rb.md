---
title: "rack-3-2-reverify-request-rb"
status: in-progress
updated: 2026-11-07
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9831
claim: "2026-11-07T14:01:35Z"
assignee: "rack-3-2-reverify-request-rb"
blocked-by: null
closed-reason: null
---

## Context

`bump-vendored-rack-anchor-to-3-2` moved the rack anchor to `v3.2.8` and re-pinned these `request.rb` bodies without re-verifying the TS ports (owner decision on that PR); this story owns the re-verification. Ruby: `vendor/rack/v3.2.8/lib/rack/request.rb`. TS: `packages/rack/src/request.ts`.

Drifted bodies: `initialize` (:62, :91), `ip` (:421), `forwarded_authority` (:400), `host_with_port` (:327), `GET` (:493), `POST` (:544, now delegates to `form_pairs` and drops 3.1's `RACK_REQUEST_FORM_INPUT` memo), `base_url` (:596), `query_parser` (:672), `parse_multipart` (:680), `split_header` (:695). New: `form_pairs` (:501-533), already shipped as `formPairs` under `@noRailsEquivalent CONVERGEABLE port-rack-request-form-pairs`. Removed upstream: `reject_trusted_ip_addresses`, `values_at` (their pins were pruned).

## Acceptance criteria

- Each listed TS method mirrors its v3.2.8 body; `formPairs` drops its receipt.
- TS members for `rejectTrustedIpAddresses` / `valuesAt` are removed if nothing in Rails v8.0.2 still calls them.
- `pnpm parity:api:pins` stays green.
