---
rfc: "0000-module-generation-mechanism"
title: "Module/mixin generation mechanism convergence"
status: draft
created: 2026-07-01
updated: 2026-07-01
owner: "@deanmarano"
packages:
  - "activerecord"
clusters:
  - "rails-deviation"
  - "followup"
related-rfcs:
  - "0023-surfaced-deviations"
---

# RFC — Module/mixin generation mechanism convergence

## Summary

Converge how trails installs generated modules and mixins onto Ruby's
`include`/ancestry semantics: the compiled callback CallTemplate/CallbackSequence
runner, `AttributeMethods#initializeGeneratedModules`, per-model prototype
carriers for delegated methods, last-included-mixin-wins ancestry, and reconciling
moved-extras against their unported source files. Extracted from
`0023-surfaced-deviations`.

## Motivation

trails emulates Ruby's `include`/`extend` with `this`-typed functions and manual
prototype wiring (see CLAUDE.md "Module mixins"). Several deviations surfaced where
the emulated mechanism diverges from Ruby ancestry — bespoke callback `_invoke`
instead of the compiled sequence, deleted `initializeGeneratedModules`, ad-hoc
delegation installation, and manual prototype overrides that don't honor
last-included-wins. These are mechanism-level, cross-cutting, and had no home.

## Design

- Drive the callback runner from the compiled CallTemplate/CallbackSequence
  instead of the bespoke `_invoke`.
- Converge `AttributeMethods#initializeGeneratedModules` to Rails (restore, don't
  delete).
- Install generated relation/delegation methods via per-model prototype carriers
  (deferred-mechanism convergence).
- Make `include()` match Ruby ancestry (last-included mixin wins), retiring manual
  prototype overrides.
- Reconcile the surfaced moved-extras whose ported methods have unported source
  files.

## Non-goals

- **Individual method ports:** this RFC is the installation _mechanism_, not
  per-method parity (that lives in the call-set parity RFCs 0044/0047).

## Rollout

1. `include-last-mixin-wins-ruby-ancestry` (ancestry foundation)
2. `converge-attribute-methods-initialize-generated-modules`,
   `delegation-generated-methods-per-model-prototype-carrier`
3. `callbacks-runner-uses-compiled-calltemplate-sequence`
4. `reconcile-unported-mixin-ported-extras`

## Verification

Generated-module installation matches Ruby ancestry; callback runner drives the
compiled sequence; `api:compare` mechanism-related mismatches clear.

## Open questions

None outstanding.

## Stories

See `pnpm tasks list --rfc <this-rfc>`.

## Changelog

- 2026-07-01: initial RFC — extracted from 0023-surfaced-deviations.
