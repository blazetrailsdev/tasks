---
title: "Delete the callerless composite-primary-key duplicate of the PrimaryKey id readers"
status: ready
updated: 2026-08-21
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# `attribute-methods/composite-primary-key.ts` is a callerless duplicate of the PrimaryKey readers

## Context

Found while converging the `ID_ATTRIBUTE_METHODS` readers to accessor properties
in PR #6825. `packages/activerecord/src/attribute-methods/composite-primary-key.ts`
(104 lines) exports `isPrimaryKeyValuesPresent`, `id`, `isId`,
`idBeforeTypeCast`, `idWas`, `idInDatabase` and `idForDatabase` — and **nothing
imports the module**:

````console
grep -rn "composite-primary-key.js" packages/ --include='*.ts' | grep -v /dist/   # no hits
```console

The live definitions are the ones in
`packages/activerecord/src/attribute-methods/primary-key.ts`, which mirror
`activerecord/lib/active_record/attribute_methods/primary_key.rb:29-66` and, as
of #6825, are accessor properties on the `PrimaryKey` module class. The dead file
still spells them as zero-arg METHODS, so the two copies now disagree in shape as
well as being duplicated — whichever a future reader finds first, one of them is
wrong.

Rails has no `composite_primary_key.rb` under `attribute_methods/`; composite-key
handling lives inside `primary_key.rb` itself. A second file is invented layout.

## Converged shape

Delete the file. Any behaviour in it that `primary-key.ts` genuinely lacks moves
into `primary-key.ts` at its Rails name first — check `isId` / `id`'s
composite arms against `primary_key.rb:29-47` before deleting, since the CPK
tuple handling there may be the more complete implementation.

## Acceptance criteria

- [ ] `attribute-methods/composite-primary-key.ts` is gone, with any unique
      behaviour merged into `primary-key.ts` at its Rails name and shape
      (properties, not methods).
- [ ] `parity:api:extra --package activerecord` does not gain names.
- [ ] Composite-PK suites (`primary-keys.test.ts`, `composite-primary-keys*`)
      pass on all three adapters.
````
