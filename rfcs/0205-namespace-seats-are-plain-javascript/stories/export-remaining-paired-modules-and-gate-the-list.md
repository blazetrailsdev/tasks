---
title: "export-remaining-paired-modules-and-gate-the-list"
status: closed
updated: 2026-11-13
rfc: "0205-namespace-seats-are-plain-javascript"
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
closed-reason: "FALSIFIED: the remaining modules and the gate shipped in trails#10064 under export-modules-paired-but-unexported-from-their-file"
---

## Context

`export-modules-paired-but-unexported-from-their-file` exported half of the
modules that `pnpm parity:class-paths:check` lists, using two shapes. Where the
parent's file does not import the module, the module self-imports
(`import * as Suppressor from "./suppressor.js"`) and seats itself on its parent
(`ActiveRecord.Suppressor = Suppressor`). Where the parent file does import it
(`Thor::Util`, `Thor::LineEditor`, `Thor::Shell::Terminal`, `I18n::Utils`), the
parent seats it, and the self-import is used for a call Ruby makes on the module
(`Thor::Util.find_by_namespace`, `vendor/thor/v1.3.2/lib/thor/util.rb:139`). The
modules below still print, because each needs its own decision:

- **The file exports an interface with the module's name**, so a same-named
  self-import conflicts with it: activerecord `attribute-methods.ts`,
  `attributes.ts`, `connection-adapters/postgresql/referential-integrity.ts`;
  activemodel `attribute-assignment.ts`, `validations/clusivity.ts`,
  `validations/comparability.ts`, `validations/resolve-value.ts`; activesupport
  `dependencies/autoload.ts`; actionpack
  `action-dispatch/http/filter-parameters.ts`; i18n `locale/tag/parents.ts`.
- **A nested module whose TS form is not a binding**: `callbacks.ts`
  `ClassMethods`, `http-authentication.ts` `Basic::ControllerMethods::ClassMethods`,
  `migration/compatibility.ts` `V5_2::CommandRecorder`,
  `connection-adapters/abstract/connection-pool.ts` `AbstractPool`.
- **A seat in the module file would close a TDZ cycle**: rack `mime.ts`
  (`namespaces.ts` → `utils.ts` → `mime.ts`; `Rack.Mime = Mime` is seated in
  `namespaces.ts`), and trailties `trailtie/configurable.ts` (imported by
  `trailtie.ts`).

## Acceptance criteria

- [ ] Each module above has a binding that a generated table can name, from the file that mirrors its `.rb`.
- [ ] The modules list in `parity:class-paths:check` is empty, and the check then fails on any paired module it would list.
