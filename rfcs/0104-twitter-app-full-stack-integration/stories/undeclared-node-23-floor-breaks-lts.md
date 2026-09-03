---
title: "Importing @blazetrails/rack throws on Node 20/22 LTS; the Node 23+ floor is undeclared"
status: closed
updated: 2026-09-02
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: ["rack", "trailties"]
deps: []
deps-rfc: []
est-loc: 60
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Will deal with node later"
---

## Context

Importing `@blazetrails/rack` throws on Node 20 and 22 — both current LTS
lines — so `trails new`, `trails server` and any generated app fail immediately
with a regex syntax error that names nothing relevant:

```text
SyntaxError: Invalid regular expression: /^(?<host>...)(:(?<port>\d+))?$/:
  Duplicate capture group name
    at packages/rack/dist/request.js:25
```

`packages/rack/src/request.ts:79,84` builds AUTHORITY with `(?<address>` in two
alternation branches. Duplicate named capture groups across alternatives are
ES2025 (V8 12.5, **Node 23+**). Minimal repro on Node 20.19.6:

```sh
node -e 'new RegExp("(?<a>x)|(?<a>y)")'
SyntaxError: Invalid regular expression: Duplicate capture group name
```

CI passes because `.github/workflows/ci.yml:427` pins `node-version: 24`. But
the repo declares that requirement nowhere: no `engines` field in the root or
any package's `package.json`, no `.nvmrc`, no `.node-version`. The generated
app's `Dockerfile` does not pin a Node version either.

So a user on Node 20 LTS gets a regex error from a file they have never heard
of, with no indication that their runtime is the problem. This cost real time
during a trailmap boot probe before the cause was found.

## Acceptance criteria

- The Node floor is declared — `engines.node` in the root and in published
  packages — and matches what CI actually runs.
- A `.nvmrc` or `.node-version` pins the version for contributors.
- `trails new` emits an app that declares the same floor, and its Dockerfile
  pins a satisfying Node version.
- Running any `trails` command on an unsupported Node fails with a message that
  says so, rather than a regex SyntaxError.
