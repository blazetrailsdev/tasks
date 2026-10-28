---
title: "ruby-compat README: the rule-1 table becomes the full export ledger"
status: in-progress
updated: 2026-10-28
rfc: "0194-ruby-compat-native-first"
cluster: ledger
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 550
pr: trails#9415
claim: "2026-10-28T17:19:34Z"
assignee: "ruby-compat-readme-export-ledger"
blocked-by: null
closed-reason: null
---

## Context

`packages/ruby-compat/README.md` § "What is here" says it tables "every export,
with the call site that justifies it (rule 1)". It has 118 rows, covering
about 111 names. `packages/ruby-compat/src/index.ts` has 488 named value
exports (trails `637fa04f91`), so 377 are absent, among them `rbFSend`,
`rbObjRespondTo`, `include`, `extend`, `rbObjDup`, `rtest`, `fetch`'s siblings
and every adapter seam.

This RFC's Appendix A is that table, measured: each export with its module,
its importer counts outside ruby-compat, its `vendor/ruby/v3.3.11` citation
and its bucket (KEEP semantic gap / KEEP stdlib / CONVERGE / DELETE /
UNEXPORT). Four exports had no machine-readable citation and were resolved by
hand: `kernelCatch` (`vm_eval.c:2342` `rb_f_catch`), `stringToSym`
(`symbol.c:862` `rb_str_intern`), `classpaths` (`variable.c:364`
`rb_class_path`), and `classModule`, a trails brand ratified by CLAUDE.md
§ "A Ruby module is a plain object or a class module". Those four JSDocs lack
the citation the README's rule 2 requires: the first three need an MRI
citation, and `classModule`, which has no MRI counterpart, needs a pointer to
the CLAUDE.md section.

The table is about 488 rows, against 118 today. If the PR goes over the
ceiling, ship the JSDoc citations first and the table second.

## Acceptance criteria

- [ ] The README's export table has one row per value export of `index.ts`,
      with the bucket and the MRI citation, or, for a platform seam, the
      RFC 0135 backend contract it serves.
- [ ] `kernelCatch`, `stringToSym` and `classpaths` carry their
      `vendor/ruby/v3.3.11/<file>:<line>` citation in their own JSDoc.
- [ ] `classModule`'s JSDoc carries `@noRailsEquivalent PERMANENT` and points
      to CLAUDE.md § "A Ruby module is a plain object or a class module".
- [ ] The README's prose claim matches the table: its rows equal `index.ts`'s
      value exports, counted with this RFC's Appendix B script.
- [ ] Docs only: no export is added, removed or renamed here.
