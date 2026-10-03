---
title: "activemodel: has_secure_password raises LoadError when the bcrypt gem port is not loaded (arm-throw mark 1 → 0)"
status: claimed
updated: 2026-10-03
rfc: "0173-activemodel-parity-100"
cluster: calls-args
packages: ["activemodel"]
deps: ["activemodel-bcrypt-engine-into-a-bcrypt-gem-package"]
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-10-03T00:43:04Z"
assignee: "activemodel-ruby-classpath-carriers-onto-rb-mod-name"
blocked-by: null
closed-reason: null
---

## Context

Split out of `activemodel-converge-secure-password-bcrypt-password` (trails#8336), which converged the
`BCrypt::Password` call row but could not take the arm-throw mark to 0.

`scripts/api-compare/arm-throw-mark.json` holds `activemodel.total: 1`,
`byFile["secure-password.ts"]: 1`. The row is `has_secure_password`'s gem load
(`vendor/rails/v8.0.2/activemodel/lib/active_model/secure_password.rb:117-125`):

```ruby
begin
  require "bcrypt"
rescue LoadError
  warn "You don't have bcrypt installed in your application. Please add it to your Gemfile and run bundle install."
  raise
end
```

`packages/activemodel/src/secure-password.ts#hasSecurePassword` has no `try` / `rescue` / `throw`:
it reaches `./bcrypt.js`, which imports the `bcryptjs` client statically, so a missing client is an
ESM link-time failure of the whole `@blazetrails/activemodel` graph rather than a `LoadError` raised at
the `has_secure_password` call. Measured while working trails#8336:

- A lazy load cannot be synchronous. `import()` is async and `has_secure_password` is a synchronous
  class macro; a module-scope `await import("bcryptjs").catch(...)` (the `activesupport/src/yaml.ts`
  shape) is top-level await in activemodel's root graph, which reds the Website `iife` build and the
  `cjs` comparison bundle.
- `createRequire` is Node-only (`node:module`), and activemodel also runs in the browser.
- A `try { } catch { warn; throw }` around nothing would be dead code written for the gate.

What makes the arm real is the gem living outside activemodel, as it does in Rails (activemodel does
not depend on bcrypt; the app's Gemfile does). Once `activemodel-bcrypt-engine-into-a-bcrypt-gem-package`
moves `BCrypt::Engine` / `BCrypt::Password` into `packages/bcrypt`, activemodel can stop importing it,
the gem port seats itself (`TopLevel.BCrypt`, CLAUDE.md § "Call-time constant resolution"), and
`require "bcrypt"` becomes "is the gem port loaded": an unseated `TopLevel.BCrypt` raises
`LoadError("cannot load such file -- bcrypt")` at the call, as `page-dump-helper.ts`'s `Launchy.open`
does for `require "launchy"`.

`docs/infrastructure/arm-mismatch-noise-floor.md:301` lists this row as one of four "permanent floor"
rows. That reading predates a gem-port package; this story is the convergence.

## Acceptance criteria

- [ ] `secure-password.ts` no longer imports the bcrypt port statically; `hasSecurePassword` reads `TopLevel.BCrypt` at call time.
- [ ] `hasSecurePassword` ports `secure_password.rb:120-125`: an unloaded gem port raises `LoadError`, `warn`s Rails' message, and re-raises.
- [ ] `pnpm parity:api:arms:throws:tighten` takes `activemodel.total` 1 → 0; the noise-floor doc drops the row from its permanent-floor list.
- [ ] `packages/activemodel/src/secure-password.test.ts` green, plus a `.trails.test.ts` case for the unloaded-gem raise.

## Verification

```bash
pnpm parity:api:arms:throws && pnpm vitest run packages/activemodel/src/secure-password.test.ts
```
