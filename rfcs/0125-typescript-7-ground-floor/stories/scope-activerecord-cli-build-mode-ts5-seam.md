---
title: "Scope activerecord-cli's solution-builder 5.x to one seam so the flip can land"
status: in-progress
updated: 2026-09-23
rfc: "0125-typescript-7-ground-floor"
cluster: build-infra
packages: ["activerecord-cli", "trails-tsc"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: trails#8019
claim: "2026-09-23T23:47:31Z"
assignee: "scope-activerecord-cli-build-mode-ts5-seam"
blocked-by: null
closed-reason: null
---

## Context

`flip-build-to-ts7` is the terminal story of RFC `0125-typescript-7-ground-floor`,
and its Definition of Done says a flip that leaves 5.x resolving for any package
**other than** `@blazetrails/trails-tsc` (and the root dev tooling) does not close
it. As of 2026-09-23 that DoD is unreachable, and this story is the decision that
makes it reachable again.

The chain, verified in the tree:

- `activerecord-cli/src/tsc-wrapper/cli.ts:248` calls `createArSolutionBuilder`
  for build mode (`trails-tsc --build`).
- `activerecord-cli/src/tsc-wrapper/ar-program.ts:37-41` implements it as a
  delegation to `createTrailsSolutionBuilder`, exported publicly via `./tsc`.
- `trails-tsc/src/build.ts:96-103` is `ts.createSolutionBuilderHost` +
  `ts.createSolutionBuilder`, for which **there is no TS 7 equivalent** — verified
  against `typescript@7.1.0-dev.20260920.1` (`dist/api` has no solution-builder
  API) and absent from the 7.1 iteration plan (microsoft/TypeScript#63703).
- `packages/activerecord-cli/package.json:35` therefore still declares
  `typescript: ^5.9.3`.

So `port-tsc-wrapper-to-ts7-api` is blocked, and through it `flip-build-to-ts7`.
The RFC's § Non-goals carves out `trails-tsc` and the root dev tooling but **not**
`activerecord-cli`, and its § "A correction worth surfacing" establishes that
`activerecord-cli` is precisely the package publishing the user-facing
`trails-tsc` bin — i.e. it is under the shipped DX the RFC claims to put entirely
on TS 7. The blocker is real, it is not going away before 7.1, and nothing
currently filed resolves it. Everything else on the ground-floor path is already
done (`fix-yaml-inferred-type-portability`, `fix-anonymous-class-declaration-emit`,
`declare-typescript-7-peer-ranges`, `port-trailties-parsets-to-ts7-api`,
`port-type-virtualization-to-ts7-api` (trails#8003), `account-for-root-ts5-api-consumers`).

**The recommended resolution is to scope the 5.x, not to widen it**: give
`activerecord-cli`'s solution-builder path the same treatment `trails-tsc` already
has — an explicit aliased `typescript-5@npm:typescript@5.9.3` import confined to
`ar-program.ts`'s build-mode delegation, with every other file in the package
(`schema-ts-parser.ts`, `schema-ts-model-parser.ts`, `auto-import.ts`, `cli.ts`'s
non-build path) on the 7.1 API per `port-tsc-wrapper-to-ts7-api`'s mapping. That
keeps the split at one named seam with a documented reason instead of a
package-wide 5.x peer, and it is the same shape the RFC already ratifies for
`trails-tsc` — whose 5.x this path transitively resolves anyway, so it adds no new
5.x resolution to the tree.

The alternative — waiting for a TS 7 solution-builder API — is not a plan: it is
not on the 7.1 roadmap, and `port-trails-tsc-to-ts7-api` already records that both
escapes were measured and ruled out (shelling to `tsc --build` cannot carry the
virtualizing host; rebuilding the build on the API loses reference redirection,
712 diagnostics vs 2, up-to-date checking, ordering and emit).

## Acceptance criteria

- [ ] RFC `0125`'s § Non-goals and `flip-build-to-ts7`'s Definition of Done are
      amended to name `activerecord-cli`'s build-mode solution-builder seam as a
      third permitted, scoped 5.x resolution — with the reason stated at the
      declaration in `ar-program.ts`, not only in the RFC.
- [ ] `packages/activerecord-cli/package.json` no longer declares a bare
      `typescript: ^5.9.3`; its 7.x dependency is the package-level one, and the
      5.x is the explicit alias, imported by its alias name and never as bare
      `typescript`.
- [ ] `port-tsc-wrapper-to-ts7-api` is unblocked and its acceptance criteria are
      restated to exempt the named seam; `flip-build-to-ts7`'s `blocked-by`
      prerequisite (1) is retired.
- [ ] `cli.test.ts`'s composite `--build` tests pass **unchanged** — the
      constraint that made the old framing jointly unsatisfiable.
- [ ] `pnpm test:types:virtualized` produces the same pass/fail verdict per
      fixture as on 5.9.3.
- [ ] `pnpm why typescript` shows 5.x resolving only for `trails-tsc`, the root
      dev tooling alias, and this one seam.

## Definition of done

Widening the DoD to permit a package-wide 5.x peer for `activerecord-cli` does not
close this story — that is the split RFC 0125 exists to avoid, and its
§ "Re-proposing RFC #59's split" rejects it by name. The seam must be one file,
aliased, documented, and everything else in the package on 7.1.

If the decision goes the other way (drop `trails-tsc --build` from the published
CLI rather than scope it), that closes this story too, but it is a product
decision and belongs in the RFC before any code moves.
