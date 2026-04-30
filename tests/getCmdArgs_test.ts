import { describe, it, expect } from "bun:test"
import * as fs from "fs/promises"
import path from "path"
import jsonSchemaDefaults from "json-schema-defaults"
import yaml from "js-yaml"
import clone from "clone"

import { getcmdArgs } from "../index.js"
import applyDefaults from "../applyDefaults.js"

const __dirname = path.dirname(new URL(import.meta.url).pathname)

const configContent = await fs.readFile(
  path.join(__dirname, "..", "configSchema.yaml")
)
const configSchema = yaml.load(configContent.toString()) as Record<string, any>
const defaults = jsonSchemaDefaults(clone(configSchema)) as Record<string, any>

function buildOptions(overrides: Record<string, any> = {}) {
  return applyDefaults(defaults, {
    inputFile: "/tmp/x.stl",
    outputFile: "/tmp/x.gcode",
    ...overrides,
  })
}

describe("getcmdArgs", () => {
  it("includes --export-gcode action", () => {
    const args = getcmdArgs(buildOptions())
    expect(args).toContain("--export-gcode")
  })

  it("returns only non-empty strings or numbers", () => {
    const args = getcmdArgs(buildOptions())
    for (const arg of args) {
      const isString = typeof arg === "string"
      const isNumber = typeof arg === "number"
      expect(isString || isNumber).toBe(true)
      if (isString) expect((arg as string).length).toBeGreaterThan(0)
    }
  })

  it("places the input file last", () => {
    const args = getcmdArgs(buildOptions({ inputFile: "/foo/bar.stl" }))
    expect(args[args.length - 1]).toBe("/foo/bar.stl")
  })

  it("includes --output with the output file", () => {
    const args = getcmdArgs(buildOptions({ outputFile: "/tmp/out.gcode" }))
    const idx = args.indexOf("--output")
    expect(idx).toBeGreaterThan(-1)
    expect(args[idx + 1]).toBe("/tmp/out.gcode")
  })

  it("omits --notes when not provided", () => {
    const args = getcmdArgs(buildOptions())
    expect(args).not.toContain("--notes")
  })

  it("includes --notes when provided", () => {
    const args = getcmdArgs(buildOptions({ notes: "hello" }))
    const idx = args.indexOf("--notes")
    expect(idx).toBeGreaterThan(-1)
    expect(args[idx + 1]).toBe("hello")
  })

  it("omits --duplicate-grid for default 1,1 (PrusaSlicer 2.9.4 segfaults on it)", () => {
    const args = getcmdArgs(buildOptions())
    expect(args).not.toContain("--duplicate-grid")
  })

  it("includes --duplicate-grid for non-default values", () => {
    const args = getcmdArgs(buildOptions({ duplicateGrid: "2,2" }))
    const idx = args.indexOf("--duplicate-grid")
    expect(idx).toBeGreaterThan(-1)
    expect(args[idx + 1]).toBe("2,2")
  })

  it("emits --extra-perimeters as a bare flag (not key/value)", () => {
    const args = getcmdArgs(buildOptions({ extraPerimeters: true }))
    const idx = args.indexOf("--extra-perimeters")
    expect(idx).toBeGreaterThan(-1)
    expect(args[idx + 1]).not.toBe(true)
  })

  it("omits boolean flags when false", () => {
    const args = getcmdArgs(buildOptions({ wipe: false, cooling: false }))
    expect(args).not.toContain("--wipe")
    expect(args).not.toContain("--cooling")
  })
})
