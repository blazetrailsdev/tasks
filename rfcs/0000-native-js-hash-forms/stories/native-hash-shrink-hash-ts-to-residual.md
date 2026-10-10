---
title: "Shrink ruby-compat hash.ts to the arms that still have a caller"
status: draft
updated: 2026-10-10
rfc: "0000-native-js-hash-forms"
cluster: substitution
packages: [ruby-compat]
deps:
  [
    native-hash-key-sites-actionpack-rack-i18n,
    native-hash-key-sites-activerecord-activemodel,
    native-hash-key-sites-trailties-activesupport-actionview,
    native-hash-merge-bang-sites-actionpack-actionview-rack-session,
    native-hash-merge-bang-sites-activerecord-activemodel-activesupport-trailties,
    native-hash-delete-sites-actionview,
    native-hash-delete-sites-actionpack-trailties-rack-test,
    native-hash-delete-sites-activerecord-activemodel-activesupport,
    native-hash-aref-aset-sites-activemodel,
    native-hash-aref-aset-sites-activerecord-actionpack-activesupport-arel,
    native-hash-each-pair-sites,
  ]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/ruby-compat/src/hash.ts` is 1,490 lines and
`hash.trails.test.ts` 1,264 (trails `ddd629745a`). ruby-compat's rule 1 is "No
member exists here without a real call site elsewhere in this repo"
(`packages/ruby-compat/README.md:163-168`), enforced by review. Once the
substitution stories have merged, some arms of `hasKey`, `hashAref`,
`hashAset`, `mergeBang` / `update`, `hashDelete` and `eachPair` will have no
caller left that reaches them, and an export may have none at all.

This story runs last. It removes what is dead and nothing else.

## Acceptance criteria

- [ ] For each of `hasKey`, `isInclude`, `hashAref`, `hashAset`, `hashDelete`,
      `update`, `mergeBang`, `merge`, `eachPair`: list its remaining non-test
      call sites outside `hash.ts`, and for each ARM of its body (plain object,
      null prototype, `Map`, own-method dispatch, block, `FrozenError`,
      `"__proto__"`) name a caller that reaches it or delete the arm with its
      tests. The table goes in the PR body.
- [ ] An export with no remaining caller is deleted, along with its row in
      `scripts/parity/ruby-compat.ts`, its `NATIVE_FORM_ANALOGUES`
      cross-reference if any, and its line in the README's § "What is here"
      table. An export that still has callers keeps its row.
- [ ] `fetch`, `deleteIf`, `keepIf`, `hashReplace`, the `Hash` class and every
      helper the RFC lists under Non-goals are untouched.
- [ ] An arm is deleted only if no caller reaches it. An arm that mirrors an
      MRI branch and is reached by one caller stays, with its citation.
- [ ] `pnpm parity:api:extra:gate` green; run `pnpm parity:api:extra:tighten`
      if the ruby-compat mark moved down.
- [ ] `pnpm vitest run packages/ruby-compat/src/hash.trails.test.ts
  packages/ruby-compat/src/rb-hash.trails.test.ts` passes.
- [ ] The PR body states the before and after line counts of both files.

## Definition of done

Deleting an arm that still has a caller, to hit a line count, does not close
this story. Neither does leaving a dead arm because its tests pass.
