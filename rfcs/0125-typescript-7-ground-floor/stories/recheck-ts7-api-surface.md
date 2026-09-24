---
title: "Move the pin to 7.1 stable and re-check the trails-tsc gaps"
status: blocked
updated: 2026-09-24
rfc: "0125-typescript-7-ground-floor"
cluster: build-infra
packages: ["trails-tsc", "activerecord-cli"]
deps: []
deps-rfc: []
est-loc: 30
priority: 5
pr: null
claim: null
assignee: null
blocked-by: "TypeScript 7.1 stable — scheduled 2026-11-24, beta 2026-10-06 (microsoft/TypeScript#63703, re-fetched 2026-09-23). latest is still 7.0.2 and 7.1 ships only as next nightlies, so neither half is actionable yet."
---

## Context

**Two jobs now that the RFC targets the 7.1 line:** move the pinned compiler off
the `7.1.0-dev` nightly onto 7.1 stable when it ships, and re-check whether the
two `trails-tsc` gaps closed. Beta is the point at which the API surface stops
moving and the re-check becomes meaningful.

### Schedule slipped — re-fetched 2026-09-23

The iteration plan (last edited 2026-09-12) moved every milestone. The
**2026-11-10 date this story was written against is now the RC, not stable**:

| Milestone  | Now            | As written 2026-08-26 |
| ---------- | -------------- | --------------------- |
| 7.1 Beta   | **2026-10-06** | 2026-09-09            |
| 7.1 RC     | 2026-11-10     | 2026-10-20            |
| 7.1 Stable | **2026-11-24** | 2026-11-10            |

So the beta this story waits on is ~2 weeks out, not past due, and stable is
**2026-11-24**. Confirmed against npm the same day: `typescript@latest` is still
`7.0.2`, `next` is `7.1.0-dev.20260923.1`, and there is no 7.1 beta on the
registry — the `beta` dist-tag still points at the unrelated `6.0.0-beta`.

**The `blocked-by` reason in the DB still cites the old 2026-09-09 beta and
2026-11-10 stable.** It is DB-owned, so it needs re-stating with a verb, not a
markdown edit:

```sh
tasks block recheck-ts7-api-surface "TypeScript 7.1 stable — scheduled 2026-11-24, beta 2026-10-06 (microsoft/TypeScript#63703, re-fetched 2026-09-23). latest is still 7.0.2 and 7.1 ships only as next nightlies, so neither half is actionable yet."
```

Re-confirmed 2026-08-25 against `7.1.0-dev.20260825.1`: there is still **no
solution-builder, build, or watch API of any kind**, verified by both a content
grep of `dist/` and the exported-name index. So the expected answer is "still
blocked" — this story exists so that is a lookup rather than a re-derivation.

## Original context

RFC `0125-typescript-7-ground-floor` recommends waiting on TS 7.1 and names
exactly two gaps that keep `trails-tsc` on TypeScript 5.x — and therefore keep
any TS 7 adoption a "split env", which the maintainer rejected on
[tasks PR #59](https://github.com/blazetrailsdev/tasks-legacy/pull/59) (2026-07-22):

1. **Programmatic `--build`** — `src/build.ts` drives `createSolutionBuilder`,
   `createSolutionBuilderHost`, `createEmitAndSemanticDiagnosticsBuilderProgram`.
2. **LS plugin hosting** — `src/lsp-plugin.ts` (the `./ts-plugin` export)
   implements `LanguageServiceHost` / `ScriptSnapshot` to decorate a
   `LanguageService`.

Neither exists in `typescript@7.0.2` nor in `typescript@7.1.0-dev.20260825.1`,
and neither is a line item in the [7.1 iteration
plan](https://github.com/microsoft/TypeScript/issues/63703), which lists only
Content Mapper API, Emit API, and Language Service API.

7.1 beta is scheduled for **2026-10-06** (slipped from 2026-09-09), which is
when the API surface stops moving. This story re-runs the RFC's mapping against it so the decision is a
lookup rather than a re-derivation.

## Acceptance criteria

- [ ] The RFC's API-surface mapping table is re-run against the 7.1 beta and
      updated in place, with the version string and verification date recorded.
- [ ] An explicit **yes/no** is recorded for each of the two gaps, with a
      source link (release notes, `.d.ts`, or an upstream issue reply).
- [ ] The pinned `typescript` moves from the `7.1.0-dev` nightly to 7.1 stable
      (2026-11-24), with `pnpm build` / `pnpm typecheck` green and no new
      diagnostics.
- [ ] The RFC records whether the two `trails-tsc` gaps closed; if they did,
      `port-trails-tsc-to-ts7-api` moves to `ready` and the aliased 5.x is
      scheduled for removal.
- [ ] If either gap is a "no", the `trails-tsc` rewrite alternative (RFC
      § Alternatives considered) is costed rather than left as a sentence.

- [ ] The root dev tooling's 5.9.3 alias (RFC § "Root-level tooling consumers")
      is re-checked. That means the `typescript` peer range of typescript-eslint
      and typedoc on `latest` (`npm view <pkg> peerDependencies`), and whether a
      programmatic build API now exists for `scripts/`. Each consumer whose
      blocker cleared gets a port story filed.

## Definition of done

Re-reading the iteration plan does not close this story. The mapping must be
re-run against the **installed 7.1 beta package's shipped `.d.ts`**, the way
the original was.

## Verification

```bash
npm view typescript dist-tags                 # confirm a 7.1 beta exists
npm i typescript@beta --prefix /tmp/ts71      # outside the tree
# then re-run the RFC's method: extract exported names from
# dist/api/**/*.d.ts + dist/ast/**/*.d.ts and diff against the
# ts.* symbol set grepped from packages/trails-tsc/src.
```

## Notes

Open questions 1 and 2 in the RFC recommend asking upstream **before 7.1 beta
prep on 2026-09-04**, while the answer can still influence 7.1. If that
happened, link the thread here.
