---
title: "converge-autosave-association-hasmany-describe-to-canonical-firm-client"
status: done
updated: 2026-07-25
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5278
claim: "2026-07-24T22:30:54Z"
assignee: "converge-autosave-association-hasmany-describe-to-canonical-firm-client"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/autosave-association.test.ts`'s
`TestDefaultAutosaveAssociationOnAHasManyAssociation` describe builds a bespoke
owner/child pair in `makeModels()` (now `HmaFirm` / `HmaClient`, both on the
canonical `companies` table, `foreignKey: "client_of"`, `autosave: true`,
child `validates("name", { presence: true })`).

Rails' counterpart
(`vendor/rails/activerecord/test/cases/autosave_association_test.rb:817`) uses
the canonical `Firm` / `Client` STI models on `companies` and drives them
through `firm.clients_of_firm` and `firm.unvalidated_clients_of_firm`
(`vendor/rails/activerecord/test/models/company.rb:61,63`). Our canonical
`Firm` already declares both associations
(`packages/activerecord/src/test-helpers/models/company.ts:196,205`), and
canonical `Company` already carries `validates_presence_of :name`, so the
bespoke pair is a straight simplification of models that exist.

The rename to `HmaFirm`/`HmaClient` landed in the
`converge-autosave-association-unenumerated-canonical-shadows` PR purely to
clear the `guardCanonicalNameShadow` collision on `Company`; converging the
~12 test bodies to canonical `Firm`/`Client` + `clientsOfFirm` was out of
scope there (it changes association names, fixture needs, and autosave
semantics per test).

## Acceptance criteria

- `makeModels()` is deleted; the describe drives canonical `Firm` / `Client`.
- Test bodies use `clientsOfFirm` / `unvalidatedClientsOfFirm` where Rails
  does, reading each Rails test first. Do NOT rename tests.
- `fixtures([...])` is widened to whatever canonical fixture sets the tests
  need (Rails: `:companies, :developers`).
- File stays green with `import "./test-helpers/canonical-model-index.js"`
  temporarily added (the shadow guard armed).
- 500 LOC ceiling; single PR from `main`, no stacking.
