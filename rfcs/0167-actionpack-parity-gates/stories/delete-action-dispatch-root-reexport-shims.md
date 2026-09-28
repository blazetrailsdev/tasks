---
title: "Delete action-dispatch's root-level re-export shims and redirect.ts"
status: draft
updated: 2026-09-28
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: ["actionpack"]
deps: ["split-redirect-to-into-redirecting-and-flash"]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/actionpack/src/action-dispatch/` holds files with no Rails counterpart
that only re-export from the file that does mirror Rails:

- one line each: `request.ts`, `response.ts`, `mime-type.ts`,
  `permissions-policy.ts`, `exception-wrapper.ts`, `flash.ts`, `journey/ast.ts`
  (`export { Ast } from "./nodes/node.js"`)
- eight lines each: `content-security-policy.ts`, `cookies.ts`,
  `session/cookie-store.ts`

and `redirect.ts` (64 lines), with `redirectTo` / `redirectBack` helpers.
Rails' `redirect_back` is `ActionController::Redirecting#redirect_back`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/redirecting.rb:122`);
`pnpm parity:api:extra` scores it moved. Its callers are
`action-dispatch/index.ts` and `action-controller/controller/redirect.test.ts`.

`action-dispatch/index.ts` re-exports ten names `parity:api:extra` scores as
moved: `Constants`, `escapeFragment`, `escapePath`, `escapeSegment`, `Journey`,
`redirectBack`, `respondTo`, `Session`, `unescapeUri`, `VERSION`.

(`constants.ts`, `deprecator.ts` and `log-subscriber.ts` at the same level
mirror `constants.rb`, `deprecator.rb` and `log_subscriber.rb` and stay.)

## Acceptance criteria

- The shim files and `redirect.ts` are deleted; every importer (including other
  packages and `packages/website`) imports from the Rails-mirroring file.
- `index.ts` re-exports Rails constants under their Rails namespaces only; its
  moved names are gone.
- `pnpm parity:api:extra --package actiondispatch` lists neither `redirect.ts`
  nor `index.ts`.
