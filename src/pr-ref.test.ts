import { describe, expect, it } from "vitest";
import { normalizePrRef, parsePrRef } from "./pr-ref.js";

describe("parsePrRef", () => {
  it("splits repo and number", () => {
    expect(parsePrRef("trails#7228")).toEqual({ repo: "trails", number: 7228 });
    expect(parsePrRef("tasks-legacy#28")).toEqual({ repo: "tasks-legacy", number: 28 });
  });

  // A bare number is the ambiguity this format exists to end: trailmap#20,
  // tasks#25 and tasks-legacy#28 all sat in the column as bare 20/25/28.
  it("refuses a bare number rather than guessing a repo", () => {
    expect(parsePrRef("7228")).toBeNull();
    expect(parsePrRef("#7228")).toBeNull();
  });

  it("refuses the malformed shapes a typo produces", () => {
    for (const bad of [
      "trails#",
      "trails#0",
      "trails#07",
      "trails#7abc",
      "Trails#7",
      "a/b#7",
      "",
    ]) {
      expect(parsePrRef(bad), bad).toBeNull();
    }
  });
});

describe("normalizePrRef", () => {
  it("trims surrounding whitespace", () => {
    expect(normalizePrRef(" tasks#94 ")).toBe("tasks#94");
  });
});
