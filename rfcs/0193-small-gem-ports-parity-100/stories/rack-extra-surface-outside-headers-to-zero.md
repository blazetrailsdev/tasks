---
title: "rack extra surface outside headers.ts to zero (23 novel, 50 moved), then gate rack"
status: in-progress
updated: 2026-10-19
rfc: "0193-small-gem-ports-parity-100"
cluster: rack-extra
packages: [rack]
deps:
  [
    rack-headers-extra-surface-to-zero,
    extra-surface-skips-well-known-symbol-keyed-members,
    rack-converge-events,
  ]
deps-rfc: []
est-loc: 550
priority: null
pr: trails#9086
claim: "2026-10-19T18:27:22Z"
assignee: "rack-extra-surface-outside-headers-to-zero"
blocked-by: null
closed-reason: null
---

## Context

From `parity:api:extra --package rack` (totals 37 novel / 69 moved / 106). Of the 37 novel, 10 are `headers.ts` (`rack-headers-extra-surface-to-zero`), `EventResponse` is `rack-converge-events`, and `[Symbol.iterator]` (`files.ts`), `[Symbol.hasInstance]` (`query-parser.ts`), `[Symbol.for("[]")]` (`response.ts`) are `extra-surface-skips-well-known-symbol-keyed-members`. This story owns the other 23: `index.ts` 7 novel (`bodyFromString`, `bodyToString`, `getDefaultQueryParser`, `getMultipartFileLimit`, `getMultipartTotalPartLimit`, `getParamDepthLimit`, `Handler`); `utils.ts` 4 novel `get*` accessors (see `rack-utils-get-prefixed-accessors-match-no-ruby-name`); `handler/node.ts` 3 novel (`Host`, `metaVars`, `Port`) + 7 moved; `constants.ts` 2 novel (`RACK_PROTOCOL`, `RACK_REQUEST_TRUSTED_PROXY`) + 7 moved `HTTP_X_FORWARDED_*`; `request.ts` (`has`, `prefetch`); `response.ts` (`ResponseRaw`; `create` moved); `mock-response.ts` (`MockCookie`); `auth/basic.ts` (`BasicRequest`); `auth-basic.ts` (`AuthBasic`, a file with no Rails counterpart); `rewindable-input.ts` (`RewindableInputMiddleware`); plus moved names in `multipart/parser.ts`, `body-proxy.ts`, `builder.ts`, `multipart-boundary.ts`, `multipart.ts`, `multipart/uploaded-file.ts` and `null-logger.ts`.

## Acceptance criteria

- [ ] `parity:api:extra --package rack` reports 0 novel and 0 moved, or only names carrying a `@noRailsEquivalent PERMANENT` receipt that cites a ratified CLAUDE.md section.
- [ ] `rack` is added to `extra-surface-mark.json` as rowless (both dimensions 0).
