---
title: "ruby-compat's leaf / browser-free property is asserted in prose and enforced by nothing"
status: ready
updated: 2026-09-01
rfc: "0129-ruby-compat"
cluster: null
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
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

## Acceptance criteria

- [ ] `packages/ruby-compat/src/**/*.ts` is added to the `no-node-builtins`
      `files` list in `eslint.config.mjs:215-222`.
- [ ] Inside `packages/ruby-compat/**`, the rule reports `noNodeBuiltin` and
      offers **no** autofix — the `ACTIVESUPPORT_REPLACEMENTS` path
      (`eslint/no-node-builtins.mjs:9-28`) must not fire there, because the
      import it writes is itself a leaf-rule violation. Covered by a rule test.
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
