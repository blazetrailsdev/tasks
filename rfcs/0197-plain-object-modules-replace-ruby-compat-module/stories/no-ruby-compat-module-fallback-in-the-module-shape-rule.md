---
title: "no-ruby-compat-module-fallback-in-the-module-shape-rule"
status: done
updated: 2026-10-23
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9270
claim: "2026-10-23T01:57:56Z"
assignee: "no-ruby-compat-module-fallback-in-the-module-shape-rule"
blocked-by: null
closed-reason: null
---

## Context

CLAUDE.md § "A Ruby module is a plain object or a class module" named the two
sanctioned shapes and then closed with an escape hatch:

> Each such site is ported so that its definitions exist before the include, or
> is left on a `Module` until its own story settles it.

The second clause was doing the work. 61 `new Module` expressions were
outstanding across six packages (actionpack 26, actionview 10, activerecord 5,
ruby-compat 4, activesupport 3, activemodel 1) when it was struck, and the
pattern keeps appearing in new ports because the rule sanctioned it.

The repo owner ruled on 2026-10-22: "A ruby module should be a js class, or a
js object. no ruby-compat modules." ruby-compat's `Module` is a carrier trails
invented, not a shape Ruby has, and an awkward definition order is fixed by
fixing the order — the remedy the first clause already names.

The rule change is docs; the 61 conversions are this RFC's existing per-package
stories, and `pnpm parity:modules`
(`scripts/parity/module-count.ts`, from `module-count-ratchet-blocks-new-ruby-compat-modules`)
already holds the line only-shrink against
`scripts/parity/module-count-mark.json`, with every mark's destination 0 and
the file deleted alongside the class
(`delete-ruby-compat-module-class-final`).

This is narrower than `claude-md-module-mixins-section-contradicts-itself`,
which is about the neighbouring "Module mixins" section's `static X = X` and
`include()` guidance; the two do not overlap.

## Acceptance criteria

- [ ] § "A Ruby module is a plain object or a class module" opens by stating a
      Ruby module is a JS object or a JS class and that there is no third
      shape, and names ruby-compat's `Module` as excluded rather than as
      "being retired".
- [ ] The "or is left on a `Module` until its own story settles it" clause is
      gone, with no replacement escape hatch, and the section says the
      definition-order fix is the whole remedy.
- [ ] The section points at `pnpm parity:modules` and its only-shrink contract,
      and at § "A documented deviation is debt, not permission" for finding a
      `Module` beside your work.
- [ ] The heading is retitled to name the rule, and every
      `CLAUDE.md, "<section title>"` citation in code is updated with it
      (`packages/ruby-compat/src/object.ts` carries the only one).
- [ ] `docs/claude-md-decision-history.md` records the ruling, its date, the
      struck clause and the 61-instance count.
- [ ] Docs-only beyond the citation rename; `npx prettier --check` clean.
