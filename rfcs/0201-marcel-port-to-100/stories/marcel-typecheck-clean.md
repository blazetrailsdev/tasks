---
title: "Take marcel to zero typecheck errors"
status: done
updated: 2026-10-21
rfc: "0201-marcel-port-to-100"
cluster: marcel-polish
packages: ["marcel"]
deps: ["marcel-lib-native-idioms", "marcel-tests-native-and-typed"]
deps-rfc: []
est-loc: 120
priority: null
pr: trails#9188
claim: "2026-10-21T20:10:01Z"
assignee: "marcel-land-on-main"
blocked-by: null
---

## Context

`tsc -p packages/marcel` reports 55 errors at `marcel-port` `3b165e0d11`, most
from values typed `unknown` (destructured `match` results, ivar `let`s), a
`File.open` options slot passed `undefined`, and `namespaces.ts`'s seat type
literal. The two polish stories before this one remove most of them; this
story takes the rest to zero.

## Acceptance criteria

- `tsc -p packages/marcel` reports 0 errors, tests included.
- No `any`, no `as unknown as` double cast, no `@ts-expect-error`.
- `namespaces.ts` is in the shape CLAUDE.md "Call-time constant resolution"
  describes for a hand port.
- `MimeType.withIo`'s `block` is required, as `with_io` yields
  unconditionally (`vendor/marcel/v1.0.4/lib/marcel/mime_type.rb`), and
  `Magic.add`'s options type admits the `{ extensions, magic, parents }` mix
  `MimeType.extend` passes.
- `packages/marcel` joins the root `tsconfig.json` references, so `pnpm build`
  and typecheck cover it. `marcel-land-on-main` (trails#9188) left it out
  because its 63 tsc errors would red `main`.
