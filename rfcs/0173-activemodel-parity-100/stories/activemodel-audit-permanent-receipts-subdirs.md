---
title: "activemodel: audit the 26 PERMANENT receipts under attribute-set/, type/, validations/"
status: ready
updated: 2026-09-30
rfc: "0173-activemodel-parity-100"
cluster: receipts
packages: ["activemodel"]
deps: ["delete-attribute-set-yaml-codec"]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The subdirectory half of activemodel's PERMANENT receipts (see
`activemodel-audit-permanent-receipts-root` for the rule):

- `attribute-set/builder.ts:65` `@missingRailsName` — `override keys(): string[] {`
- `attribute-set/codecs/codec.ts:7` `@noRailsEquivalent` — `export interface AttributeSetCoder {`
- `attribute-set/codecs/codec.ts:13` `@noRailsEquivalent` — `export interface AttributeSetEnvelope {`
- `attribute-set/codecs/codec.ts:21` `@noRailsEquivalent` — `export interface AttributeSetCodec {`
- `attribute-set/codecs/codec.ts:27` `@noRailsEquivalent` — `export class AttributeSetCodecError extends Error {`
- `attribute-set/codecs/codec.ts:39` `@noRailsEquivalent` — `export function toEnvelope(coder: AttributeSetCoder): AttributeSetEnvelope {`
- `attribute-set/codecs/codec.ts:60` `@noRailsEquivalent` — `export function fromEnvelope(envelope: AttributeSetEnvelope): AttributeSetCoder`
- `attribute-set/codecs/json.ts:8` `@noRailsEquivalent` — `export const jsonCodec: AttributeSetCodec = {`
- `attribute-set/codecs/yaml.ts:9` `@noRailsEquivalent` — `export const yamlCodec: AttributeSetCodec = {`
- `type/date.ts:69` `@missingRailsName` — `protected fastStringToDate(string: string): Temporal.PlainDate | null {`
- `type/registry.ts:45` `@noRailsEquivalent` — `keyFor(type: ValueType): string | null {`
- `type/registry.ts:51` `@noRailsEquivalent` — `export const typeRegistry = new TypeRegistry();`
- `type/helpers/mutable.ts:6` `@noRailsEquivalent` — `export const MutableModule = {`
- `type/helpers/numeric.ts:45` `@noRailsEquivalent` — `export function applyNumericMixin<TBase extends AbstractValueTypeCtor>(`
- `type/internal/sentinels.ts:14` `@noRailsEquivalent` — `export function isDateInfinity(v: unknown): v is DateInfinity {`
- `type/internal/sentinels.ts:19` `@noRailsEquivalent` — `export function isDateNegativeInfinity(v: unknown): v is DateNegativeInfinity {`
- `validations/_accessor.ts:1` `@noRailsEquivalent` — `export interface InheritedAccessor {`
- `validations/acceptance.ts:32` `@missingRailsCall` — `setupBang(klass: AttributeMethodQueryable): void {`
- `validations/acceptance.ts:87` `@missingRailsCall` — `[included](klass: AttributeMethodQueryable): void {`
- `validations/acceptance.ts:88` `@noRailsEquivalent` — `[included](klass: AttributeMethodQueryable): void {`
- `validations/comparability.ts:29` `@noRailsEquivalent` — `export function compareOperator(`
- `validations/confirmation.ts:19` `@missingRailsArgs` — `validateEach(record: ValidatableRecord, attribute: string, value: unknown): void`
- `validations/exclusion.ts:20` `@missingRailsArgs` — `validateEach(record: ValidatableRecord, attribute: string, value: unknown): void`
- `validations/inclusion.ts:20` `@missingRailsArgs` — `validateEach(record: ValidatableRecord, attribute: string, value: unknown): void`
- `validations/numericality.ts:66` `@missingRailsArgs` — `validateEach(`
- `validations/numericality.ts:156` `@missingRailsArgs` — `export function parseAsNumber(`

## Acceptance criteria

- [ ] Same as `activemodel-audit-permanent-receipts-root`: each receipt is tabled against its ratifying CLAUDE.md section, or converged, or split into a filed story and re-tagged `CONVERGEABLE <slug>`.
- [ ] `attribute-set/codecs/*` receipts are resolved together with `delete-attribute-set-yaml-codec` (RFC 0170) — a receipt on a file that story deletes is not audited, it is deleted.

## Verification

```bash
pnpm parity:api:extra:gate && pnpm parity:api:receipts:gate && pnpm parity:api:reasons && pnpm parity:api:calls:args
```
