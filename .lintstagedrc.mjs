// Mirrors the `format:check` + `lint` pair the `ci` workflow runs, scoped to the
// staged files.
//
// Order is load-bearing for markdown: prettier reflows prose, and a reflow can
// move a token to the start of a line where markdownlint reads it differently —
// a wrapped `#1234` becomes MD018 (no space after hash on an atx heading). So
// markdownlint must see prettier's OUTPUT, not the author's input. This is not
// hypothetical: it merged in tasks #69 and red `pnpm lint` on #72.
//
// markdownlint does NOT get `--fix` here. Its MD018 fix inserts a space, which
// turns a wrapped PR reference into a real heading — a silent prose corruption.
// The rules prettier and markdownlint genuinely disagree on are already settled
// in `.markdownlint-cli2.jsonc`, in prettier's favour.

const IGNORED = ["rfcs/0000-template/", "index.md"];
const linted = (files) => files.filter((f) => !IGNORED.some((i) => f.includes(i)));

export default {
  "*.md": (files) => {
    const md = linted(files);
    const cmds = [`prettier --write ${files.join(" ")}`];
    if (md.length > 0) cmds.push(`markdownlint-cli2 ${md.join(" ")}`);
    return cmds;
  },
  "*.{json,jsonc,yml,yaml,ts,mts,cts,js,mjs,cjs}": ["prettier --write"],
};
