import { render } from "../index.js"
import path from "path"
import assert from "assert"
import fs from "fs/promises"
import { describe, it, expect } from "bun:test"

const __dirname = path.dirname(new URL(import.meta.url).pathname)

describe("NodeSlicer", () => {
  it("Rendering an STL file should return a buffer", async () => {
    const dataBuffer = await render({
      inputFile: path.join(__dirname, "cone.stl"),
    })

    expect(Buffer.isBuffer(dataBuffer))

    const bufferString = dataBuffer.toString().split("\n").slice(2).join("\n")
    const fileString = await fs
      .readFile(path.join(__dirname, "cone.gcode"), {
        encoding: "utf-8",
      })
      .toString()

    assert.equal(
      bufferString + "\n",
      fileString,
      bufferString.length +
        " and " +
        fileString.length +
        "reference Gcode file differ!"
    )
  })
})
