---
title: "Rename the Module mixin hook Symbol.for keys off the activesupport namespace"
status: in-progress
updated: 2026-09-03
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 7466
claim: "2026-09-03T23:40:03Z"
assignee: "move-monitor-mixin-to-ruby-compat"
blocked-by: null
closed-reason: null
---

## Context

`packages/ruby-compat/src/include.ts` still spells its hook and registry keys
with an `@blazetrails/activesupport:` prefix:

- `included` = `Symbol.for("@blazetrails/activesupport:included")`
- `extended` = `Symbol.for("@blazetrails/activesupport:extended")`
- the internal `includedKeys` / `extendedKeys` / `includedModules` /
  `moduleVisibility` keys

PR #7361 moved the file into ruby-compat and KEPT the prefix deliberately, as
the story required the choice to be stated rather than accidental:
`Symbol.for` reads the cross-realm global registry, so the string IS the
identity. Renaming it while activesupport's re-export shims are still in place
risks a build that mixes a pre-rename module (reaching for the old key) with a
post-rename one — the hook then silently never fires, which no test asserts.

Once `delete-second-round-ruby-compat-reexport-shims` has removed
`packages/activesupport/src/{include,prepend}.ts`, there is exactly one
definition site and the rename is safe. The prefix is then simply wrong: it
names a package that no longer owns the mechanism.

## Acceptance criteria

- [ ] Depends on `delete-second-round-ruby-compat-reexport-shims`; do not start
      before it lands.
- [ ] All six `Symbol.for("@blazetrails/activesupport:…")` keys in
      `packages/ruby-compat/src/include.ts` are renamed to a
      `@blazetrails/ruby-compat:` namespace.
- [ ] `git grep '@blazetrails/activesupport:'` returns nothing that refers to
      these keys — a consumer reconstructing one with `Symbol.for` would break
      silently, so the grep is the check.
- [ ] The JSDoc paragraph on `included` explaining the KEPT prefix is deleted
      with it, not reworded.
- [ ] `include` / `concern` / `proxy-wrappers` tests pass.
