import { describe, it, expect } from "bun:test"
import applyDefaults from "../applyDefaults.js"

describe("applyDefaults", () => {
  it("fills in missing keys from defaults", () => {
    const result = applyDefaults({ a: 1, b: 2 }, { b: 20 })
    expect(result).toEqual({ a: 1, b: 20 })
  })

  it("preserves user-provided keys, including extras not in defaults", () => {
    const result = applyDefaults({ a: 1 }, { a: 100, c: 3 })
    expect(result).toEqual({ a: 100, c: 3 })
  })

  it("treats explicit undefined as missing and fills the default", () => {
    const result = applyDefaults({ a: 10 }, { a: undefined })
    expect(result).toEqual({ a: 10 })
  })

  it("preserves falsy non-undefined values (0, false, empty string)", () => {
    const result = applyDefaults(
      { a: 1, b: true, c: "x" },
      { a: 0, b: false, c: "" }
    )
    expect(result).toEqual({ a: 0, b: false, c: "" })
  })

  it("does not mutate inputs", () => {
    const defaults = { a: 1, nested: { x: 1 } }
    const options = { b: 2 }
    applyDefaults(defaults, options)
    expect(defaults).toEqual({ a: 1, nested: { x: 1 } })
    expect(options).toEqual({ b: 2 })
  })
})
