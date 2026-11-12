---
title: "constant-table-walks-const-modules-repo-wide"
status: draft
updated: 2026-11-12
rfc: "0226-mail-stack-to-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# Walk exported const modules in every package's constant table

## Context

`scripts/api-compare/constant-table.ts` `walkConstants` reads exported class
declarations, plus (behind `PackageLayout.constModules`, enabled only for `mail`)
an exported `const X = { … }` plain-object module or `const X = Struct.new(…)`
(`seatedNames`). Turning the flag on repo-wide shrinks `unwalked` in
`scripts/api-compare/constant-residue.json` by hundreds of rows (actionpack's
`Caching`, `Callbacks`, `ClassMethods`…; actionmailer, actionmailbox, …), but it
also regenerates 17 `constants.generated.ts` tables, grows `excluded` (only-shrink)
with unpaired exports (`actionmailbox callbacks.ts::ClassMethods`,
`actionpack namespaces.ts::AbstractController`, `marcel tables.ts::EXTENSIONS`),
and reports seated-vs-generated path conflicts.

## Acceptance criteria

- [ ] `constModules` is the default for every package, and the flag is removed.
- [ ] Each newly walked export no Ruby constant answers is converged (deleted, unexported, or paired), so `excluded` does not grow.
- [ ] `pnpm parity:class-paths --check` reports no new seated/generated conflicts; the `unwalked` rows the walk now reaches are deleted.
