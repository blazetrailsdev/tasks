---
title: "Converge mini_magick's lib bodies to native, typed TypeScript"
status: done
updated: 2026-10-27
rfc: "0203-mini-magick-port-to-100"
cluster: mini-magick-polish
packages: ["mini-magick"]
deps:
  [
    "mini-magick-drop-codegen-shims-and-activesupport",
    "mini-magick-shell-over-open3-capture3",
    "mini-magick-method-missing-proxies",
    "mini-magick-cli-tool-shortcuts",
  ]
deps-rfc: []
est-loc: 500
priority: null
pr: trails#9388
claim: "2026-10-27T20:38:25Z"
assignee: "mini-magick-lib-native-idioms"
blocked-by: null
---

## Context

The generator lowers a call on a receiver it cannot type through generic
ruby-compat dispatch or an inline type switch. At `5f96afb0a0` the lib has 22
`rbStrSend` calls, 17 `rbCheckArrayType` splat conversions, 8 `rbEqual` and 15
`rbObjAsString`, and `x instanceof globalThis.Set` / `Array.isArray(x)` chains
for `<<`. By file, counting `rbBinop`, `rbStrSend`, `rbEqual`,
`rbCheckArrayType` and Set checks: `image.ts` 31, `image/info.ts` 17, `tool.ts`
12, `shell.ts` 7, `utilities.ts` 3. Most receivers are known:

- `Tool#args` is an Array (`tool.rb`, `@args = []`), so `args << arg.to_s`
  (`tool.rb:135-138`) is a `push`;
- `Info`'s `@info` is a Hash (`image/info.rb`), and `cli_version`'s output is a
  String.

CLAUDE.md asks for the native form wherever the type is known, and for the
ruby-compat function where Ruby semantics differ (`String#[]` with a Regexp,
`split`, `fetch`).

## Acceptance criteria

- Every lib body in `packages/mini-magick/src` mirrors its method in
  `vendor/mini_magick/v5.2.0/lib` branch for branch (CLAUDE.md "Fidelity is the
  job").
- A call on a receiver whose type is known uses the native form; no
  `rbStrSend` or inline type switch remains where the type is known.
- Instance variables and parameters carry real types; no `unknown` remains
  where the Ruby type is evident.
- The PR body lists each pattern converged, for the generator.
