---
title: "rack extra surface outside headers.ts to zero (27 novel, 50 moved), then gate rack"
status: draft
updated: 2026-10-15
rfc: "0000-small-gem-ports-parity-100"
cluster: rack-extra
packages: [rack]
deps: [rack-headers-extra-surface-to-zero, extra-surface-skips-well-known-symbol-keyed-members]
deps-rfc: []
est-loc: 550
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

From `parity:api:extra --package rack` (totals 37 novel / 69 moved / 106): `index.ts` 7 novel (`bodyFromString`, `bodyToString`, `getDefaultQueryParser`, `getMultipartFileLimit`, `getMultipartTotalPartLimit`, `getParamDepthLimit`, `Handler`); `utils.ts` 4 novel `get*` accessors (see `rack-utils-get-prefixed-accessors-match-no-ruby-name`); `handler/node.ts` 3 novel + 7 moved; `constants.ts` 2 novel (`RACK_PROTOCOL`, `RACK_REQUEST_TRUSTED_PROXY`) + 7 moved `HTTP_X_FORWARDED_*`; `request.ts` (`has`, `prefetch`); `response.ts` (`ResponseRaw`, `create`); `mock-response.ts` (`MockCookie`); `auth/basic.ts` (`BasicRequest`); `auth-basic.ts` (`AuthBasic`, a file with no Rails counterpart); `rewindable-input.ts` (`RewindableInputMiddleware`); plus moved names in `multipart/parser.ts`, `body-proxy.ts`, `builder.ts`, `multipart-boundary.ts`, `multipart.ts`, `multipart/uploaded-file.ts` and `null-logger.ts`.

## Acceptance criteria

- [ ] `parity:api:extra --package rack` reports 0 novel and 0 moved, or only names carrying a `@noRailsEquivalent PERMANENT` receipt that cites a ratified CLAUDE.md section.
- [ ] `rack` is added to `extra-surface-mark.json` as rowless (both dimensions 0).
