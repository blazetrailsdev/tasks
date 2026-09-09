---
title: "api-compare-extractor-blind-to-class-expression-members"
status: draft
updated: 2026-09-09
rfc: "0139-actiondispatch-journey-parity"
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

`journey-scanner-nested-class-shape` restored Rails' nested
`ActionDispatch::Journey::Scanner::Scanner`
(`vendor/rails/actionpack/lib/action_dispatch/journey/scanner.rb:19-26`) and moved
`peek_byte` onto it, as `scanner.rb:20-25` has it. TypeScript cannot declare two
classes named `Scanner` in one module, so the nested class is written the only way
the language allows — a named class EXPRESSION assigned to a static:

```ts
export class Scanner {
  static Scanner = class Scanner { peekByte(): number { ... } };
}
```

`scripts/api-compare/extract-ts-api.ts` does not descend into a static property
initializer, so it sees none of that class's members. `journey/scanner.rb` therefore
scores 7/8 (88%) with `peek_byte → peekByte` reported missing, even though the method
exists, on exactly the host Rails puts it on.

Two other shapes were measured and are worse:

- `export namespace Scanner { export class Scanner { ... } }` merges with the class
  declaration and the extractor then reads ONLY the namespace: the outer class's seven
  members all vanish and the file scores 2/8 (25%).
- Leaving `peekByte` on the OUTER class scores 8/8 but is the divergence the story
  removed — Rails' outer `Scanner` has no `peek_byte`.

## Acceptance criteria

- The TS API extractor reads members of a class expression assigned to a static
  property (and to a module-level `const`), so a nested Ruby class ported that way is
  measured.
- `pnpm parity:api --package actiondispatch` scores `journey/scanner.rb` at 100% with
  no source change to `journey/scanner.ts`.
- `pnpm parity:api:extra --package actiondispatch` still lists no `journey/scanner.ts`
  — the nested class's `@internal` StringScanner-shaped members (`string`, `pos`,
  `isEos`, `skip`) must stay out of the measured surface.
- No other package's totals move; if any do, the movement is read and recorded.
