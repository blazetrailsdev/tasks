---
title: "Fix SingularAssociation TDZ when belongs-to builder is the entry module"
status: draft
updated: 2026-09-15
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Importing the built `packages/activerecord/dist/associations/builder/belongs-to.js` as a plain-node entry module throws `ReferenceError: Cannot access 'SingularAssociation' before initialization`. It reproduces on main before #7788 (verified by reverting that file and rebuilding), so it predates the umbrella-seat moves. Every other module checked for #7788 loads cleanly as an entry.

`belongs-to.ts` does `class BelongsTo extends SingularAssociation` (`./singular-association.js`). Some import it reaches cycles back into `belongs-to.ts` before `singular-association.ts` finishes evaluating. Rails autoloads the builders (`associations/builder/belongs_to.rb` `class BelongsTo < SingularAssociation`), so it has no such cycle.

## Acceptance criteria

- Trace the cycle (entry `belongs-to.js` → … → back to `belongs-to.js`) and name each edge.
- Break it with a plain import restructure or, only if a genuine `extends` cycle remains, the zero-import slot shape in CLAUDE.md § "Call-time constant resolution".
- `node -e "import('./dist/associations/builder/belongs-to.js')"` and `import('./dist/associations/builder/singular-association.js')` both load, verified against the built dist.
