import { describe, it, expect } from "vitest";
import { hello } from "~/hello";

describe("testing example", () => {
  it("should run", () => {
    expect(true).toBe(true);
  });

  it("should fail", () => {
    expect(true).toBe(false);
  });

  it("say hello", () => {
    expect(hello()).equal("hello");
  });
});
