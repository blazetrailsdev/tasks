---
title: "ruby-compat's leaf / browser-free property is asserted in prose and enforced by nothing"
status: in-progress
updated: 2026-09-02
rfc: "0129-ruby-compat"
cluster: null
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 180
priority: 63
pr: 7383
claim: "2026-09-02T11:42:52Z"
assignee: "port-lazy-attribute-hash-delegate-to-a-record"
blocked-by: null
closed-reason: null
---

## Context

RFC 0129's README:526 states "ruby-compat is a leaf and depends on nothing", and
`packages/ruby-compat/package.json:4` advertises it as "a leaf package with no
workspace dependencies". Both are **true today and enforced by nothing**.

Measured on this branch (`pnpm build` in `packages/ruby-compat`, then reading
the built output, not `src/`):

- `packages/ruby-compat/package.json` has no `dependencies` block at all.
- `grep -rn 'node:\|require(' packages/ruby-compat/dist/**/*.js` → **zero hits**.
- Every non-relative `import` in `dist/**/*.js` is `vitest`, and only from the
  compiled `*.trails.test.js` files — no runtime module imports anything but a
  relative sibling.

So the browser-friendly claim holds **by luck**, not by construction. The gap:

**`packages/ruby-compat/src/**`is absent from the`no-node-builtins`lint's`files`list.**`eslint.config.mjs:213-250`scopes`blazetrails/no-node-builtins`to arel, activemodel, activerecord,
activesupport, rack, actionpack and actionview. The one package whose entire
reason for existing is to be a dependency-free MRI-primitives leaf is the one
package the browser-compat rule does not cover. A future story that adds, say,
a`Digest`or`Tempfile`seat and reaches for`node:crypto` gets no lint, and
the leaf rule fails silently.

A lint alone is also not sufficient, because it only sees this package's own
`src/`. The leaf rule is equally broken by a `dependencies` entry on another
workspace package (which is exactly the wall
`move-tempfile-to-ruby-compat` is `blocked-by`, and the decision
`ruby-named-file-dir-fileutils-facade` is scheduled to settle). Both halves —
no Node builtin, no workspace dependency — want one assertion over the **built**
output, because that is the only place a transitive edge is visible.

This story is deliberately tooling-only and files no relocations: the
relocation stories already exist under this RFC
(`ruby-named-file-dir-fileutils-facade`, `move-string-io-to-ruby-compat`,
`move-tempfile-to-ruby-compat`, `move-rb-hash-to-ruby-compat`, …). It exists so
that when they land, the property they depend on is checked rather than assumed.

Note the lint's replacement table (`eslint/no-node-builtins.mjs:9-28`) hard-codes
`@blazetrails/activesupport` as the fix for `fs` / `path` / `crypto`. That is the
wrong advice inside ruby-compat, which cannot import activesupport. Enrolling
this package therefore needs the rule to emit the plain `noNodeBuiltin` message
there rather than the `useAdapter` autofix, or the autofix will write an import
that breaks the leaf rule it is meant to protect.

### Import guards are blind to Node _globals_ — close that at compile time

An import-specifier guard sees `import … from "node:fs"`. It cannot see
`Buffer`, `process`, `__dirname` or `__filename`, which are **ambient globals**,
not imports — and they break a browser bundle just as thoroughly.

Root `tsconfig.json` sets no `types` restriction, so `@types/node` leaks
ambiently into every package, ruby-compat included. Measured on this branch,
compiling a one-line probe inside `packages/ruby-compat/src/`:

```ts
export const p = Buffer.from("x").length + process.pid;
```

- with the tsconfig as it stands today → **compiles clean**;
- with `--types` (an empty types list) →
  `error TS2591: Cannot find name 'Buffer'` and the same for `process`.

ruby-compat uses none of these globals today (grepped over `dist/**/*.js`), so
this is a one-line fence around a currently-empty gap rather than a burndown.
It is the cheapest of the three places this could be caught: `tsc` fails in the
editor and on the pre-commit hook, where a CI-only guard fails minutes later
and a browser test lane fails as a runtime error inside a bundle.

**A browser test lane was considered and rejected here.** It is the only thing
that could catch a Node global at _runtime_, but `"types": []` catches the same
class at compile time for one line, and ruby-compat's suite is pure value
semantics (`Hash`, `Rational`, `Range`, `Regexp`, `Comparable`, `Symbol`,
`String#succ`) that exercises no platform surface — so a browser run would be a
load check wearing a test suite's clothes, and the guard above already is the
load check. The repo also has no browser test infrastructure to build on (no
`@vitest/browser`; `playwright-core` is actionpack's system-testing dependency
and `jsdom` is the website's), and RFC `0028-ci-cost-optimization` is actively
reducing lane count. Revisit only when ruby-compat holds a member whose
behaviour genuinely diverges across engines — `String#succ`'s UTF-8 width
handling is the nearest candidate, and it does not diverge today. Do not
re-litigate this without such a member in hand.

## Acceptance criteria

- [ ] `packages/ruby-compat/src/**/*.ts` is added to the `no-node-builtins`
      `files` list in `eslint.config.mjs:215-222`.
- [ ] Inside `packages/ruby-compat/**`, the rule reports `noNodeBuiltin` and
      offers **no** autofix — the `ACTIVESUPPORT_REPLACEMENTS` path
      (`eslint/no-node-builtins.mjs:9-28`) must not fire there, because the
      import it writes is itself a leaf-rule violation. Covered by a rule test.
- [ ] `packages/ruby-compat/tsconfig.json` sets `"types": []`, so ambient
      `@types/node` no longer reaches this package and `Buffer` / `process` /
      `__dirname` become compile errors rather than silently-valid code. Prove
      it the same way the probe above did — add the one-line probe, confirm
      `tsc` goes red, remove it — and state that in the PR body.
- [ ] `pnpm typecheck` and `pnpm build` stay green for ruby-compat and for every
      package that references it after that change.
- [ ] A guard asserts, over `packages/ruby-compat/dist/**/*.js` (built output,
      not `src/`), that no runtime module imports a `node:`-prefixed or bare
      Node builtin specifier, and that `packages/ruby-compat/package.json`
      declares no `dependencies` / `peerDependencies`. Compiled `*.test.js`
      files are the one exemption and are named explicitly.
- [ ] The guard fails on a deliberately-introduced violation — add one
      temporarily, confirm red, remove it — and that is stated in the PR body.
      A guard that has never gone red proves nothing.
- [ ] The guard runs in CI. Name the job it joins in the PR body; if it needs a
      build step it does not already have, say so rather than making it a no-op
      on an absent `dist/`.
- [ ] RFC 0129 README:526 is updated to cite the guard, so the leaf rule reads
      as enforced rather than asserted.
- [ ] `pnpm parity:api` / `pnpm parity:test` deltas non-negative;
      `pnpm parity:api:extra:gate` unchanged (this story adds no public surface —
      ruby-compat is pinned at `novel: 0`,
      `scripts/api-compare/extra-surface-mark.json`).
