import * as fs from "fs/promises"
import path from "path"
import os from "os"

import { promisify } from "node:util"
import { execFile } from "child_process"

const execFileAsync = promisify(execFile)

import jsonSchemaDefaults from "json-schema-defaults"
import yaml from "js-yaml"
import clone from "clone"
import temp from "temp"
import tv4 from "tv4"

import applyDefaults from "./applyDefaults.js"

const configContent = await fs.readFile(
  path.join(__dirname, "configSchema.yaml")
)
const configSchema = yaml.load(configContent.toString()) as Record<string, any>

function toPercentString(val: number) {
  return String(val * 100) + "%"
}

function getcmdArgs(o: Record<string, any>): string[] {
  return [
    ["--output", o.outputFile],

    // Non-slicing actions
    o.repair ? "--repair" : [],
    o.cut ? "--cut" : [],
    o.split ? "--split" : [],
    o.info ? "--info" : [],
    ["--threads", o.threads],

    // Output options
    o.outputFilenameFormat
      ? ["--output-filename-format", o.outputFilenameFormat]
      : [],
    ...(Array.isArray(o.postProcess)
      ? o.postProcessScripts.map((script: string) => ["--post-process", script])
      : []),
    // TODO: Does not seem to be supported by PrusaSlicer
    // o.exportSvg ? "--export-svg" : [],
    o.merge ? "--merge" : [],

    // Printer options
    ["--nozzle-diameter", o.nozzleDiameter],

    // TODO: Does not seem to be supported by PrusaSlicer
    // ["--print-center", o.printCenter.x + "," + o.printCenter.y],

    ["--z-offset", o.zOffset],
    ["--gcode-flavor", o.gcodeFlavor],
    o.useRelativeEDistances ? "--use-relative-e-distances" : [],
    o.useFirmwareRetraction ? "--use-firmware-retraction" : [],
    o.useVolumetricE ? "--use-volumetric-e" : [],
    o.gcodeArcs ? "--gcode-arcs" : [],
    o.g0 ? "--g0" : [],
    o.gcodeComments ? "--gcode-comments" : [],

    // TODO: Does not seem to be supported by PrusaSlicer
    // ["--vibration-limit", o.vibrationLimit],

    //'--pressure-advance ' + o.pressureAdvance,

    // Filament options
    ["--filament-diameter", o.filamentDiameter],
    ["--extrusion-multiplier", o.extrusionMultiplier],
    ["--temperature", o.temperature],
    ["--first-layer-temperature", o.firstLayerTemperature],
    ["--bed-temperature", o.bedTemperature],
    ["--first-layer-bed-temperature", o.firstLayerBedTemperature],

    // Speed options
    ["--travel-speed", o.travelSpeed],
    ["--perimeter-speed", o.perimeterSpeed],
    ["--small-perimeter-speed", o.smallPerimeterSpeed],
    ["--external-perimeter-speed", o.externalPerimeterSpeed],
    ["--infill-speed", o.infillSpeed],
    ["--solid-infill-speed", o.solidInfillSpeed],
    ["--top-solid-infill-speed", o.topSolidInfillSpeed],
    ["--support-material-speed", o.supportMaterialSpeed],
    ["--support-material-interface-speed", o.supportMaterialInterfaceSpeed],
    ["--bridge-speed", o.bridgeSpeed],
    ["--gap-fill-speed", o.gapFillSpeed],
    ["--first-layer-speed", o.firstLayerSpeed],

    // Accelerator options
    ["--perimeter-acceleration", o.perimeterAcceleration],
    ["--infill-acceleration", o.infillAcceleration],
    ["--bridge-acceleration", o.bridgeAcceleration],
    ["--first-layer-acceleration", o.firstLayerAcceleration],
    ["--default-acceleration", o.defaultAcceleration],

    // Accuracy options
    ["--layer-height", o.layerHeight],
    ["--first-layer-height", o.firstLayerHeight],
    ["--infill-every-layers", o.infillEveryLayers],
    ["--solid-infill-every-layers", o.solidInfillEveryLayers],

    // Print Options
    ["--perimeters", o.perimeters],
    ["--top-solid-layers", o.topSolidLayers],
    ["--bottom-solid-layers", o.bottomSolidLayers],
    o.solidLayers ? "--solid-layers" : [],
    ["--fill-density", toPercentString(o.fillDensity)],
    ["--fill-angle", o.fillAngle],
    ["--fill-pattern", o.fillPattern],
    ["--solid-fill-pattern", o.solidFillPattern],
    o.startGcode ? "--start-gcode" : [],
    o.endGcode ? "--end-gcode" : [],
    o.layerGcode ? "--layer-gcode" : [],
    o.toolchangeGcode ? "--toolchange-gcode" : [],
    ["--seam-position", o.seamPosition],
    o.externalPerimetersFirst ? "--external-perimeters-first" : [],
    o.spiralVase ? "--spiral-vase" : [],
    o.onlyRetractWhenCrossingPerimeters
      ? "--only-retract-when-crossing-perimeters"
      : [],
    ["--solid-infill-below-area", o.solidInfillBelowArea],
    o.infillOnlyWhereNeeded ? "--infill-only-where-needed" : [],
    o.infillFirst ? "--infill-first" : [],

    // Quality options
    o.extraPerimeters ? "--extra-perimeters" : [],
    o.avoidCrossingPerimeters ? "--avoid-crossing-perimeters" : [],
    o.thinWalls ? "--thin-walls" : [],
    o.overhangs ? "--overhangs" : [],

    // Support material options
    o.supportMaterial ? "--support-material" : [],
    ["--support-material-threshold", o.supportMaterialThreshold],
    ["--support-material-pattern", o.supportMaterialPattern],
    ["--support-material-spacing", o.supportMaterialSpacing],
    ["--support-material-angle", o.supportMaterialAngle],
    ["--support-material-interface-layers", o.supportMaterialInterfaceLayers],
    ["--support-material-interface-spacing", o.supportMaterialInterfaceSpacing],
    ["--raft-layers", o.raftLayers],
    ["--support-material-enforce-layers", o.supportMaterialEnforceLayers],
    o.dontSupportBridges ? "--dont-support-bridges" : [],

    // Retraction options
    ["--retract-length", o.retractLength],
    ["--retract-speed", o.retractSpeed],
    ["--retract-restart-extra", o.retractRestartExtra],
    ["--retract-before-travel", o.retractBeforeTravel],
    ["--retract-lift", o.retractLift],
    o.retractLayerChange ? "--retract-layer-change" : [],
    o.wipe ? "--wipe" : [],

    // Retraction options for multi-extruder setups
    ["--retract-length-toolchange", o.retractLengthToolchange],
    ["--retract-restart-extra-toolchange", o.retractRestartExtraToolchange],

    // Cooling options
    o.cooling ? "--cooling" : [],
    ["--min-fan-speed", o.minFanSpeed * 100], // in %
    ["--max-fan-speed", o.maxFanSpeed * 100], // in %
    ["--bridge-fan-speed", o.bridgeFanSpeed * 100], // in %
    ["--fan-below-layer-time", o.fanBelowLayerTime],
    ["--slowdown-below-layer-time", o.slowdownBelowLayerTime],
    ["--min-print-speed", o.minPrintSpeed],
    ["--disable-fan-first-layers", o.disableFanFirstLayers],
    o.fanAlwaysOn ? "--fan-always-on" : [],

    // Skirt options
    ["--skirts", o.skirts],
    ["--skirt-distance", o.skirtDistance],
    ["--skirt-height", o.skirtHeight],
    ["--min-skirt-length", o.minSkirtLength],
    ["--brim-width", o.brimWidth],

    // Transform options
    ["--scale", o.scale],
    ["--rotate", o.rotate],
    ["--duplicate", o.duplicate],
    ["--duplicate-grid", o.duplicateGrid],
    ["--duplicate-distance", o.duplicateDistance],
    //'--xy-size-compensation ' + o.xySizeCompensation,

    // Sequential printing options
    o.completeObjects ? "--complete-objects" : [],
    ["--extruder-clearance-radius", o.extruderClearanceRadius],
    ["--extruder-clearance-height", o.extruderClearanceHeight],

    // Miscellaneous options:
    [o.notes ? ["--notes", o.notes] : []],
    ["--resolution", o.resolution],

    // TODO: Does not seem to be supported by PrusaSlicer
    // ["--bed-size", o.bedSize.width + "," + o.bedSize.height],

    // Flow options (advanced):
    ["--extrusion-width", o.extrusionWidth],
    o.firstLayerExtrusionWidth
      ? ["--first-layer-extrusion-width", o.firstLayerExtrusionWidth]
      : [],
    ["--perimeter-extrusion-width", o.perimeterExtrusionWidth],
    //'--external-perimeter-extrusion-width ' +
    //  o.externalPerimeterExtrusionWidth,
    ["--infill-extrusion-width", o.infillExtrusionWidth],
    ["--solid-infill-extrusion-width", o.solidInfillExtrusionWidth],
    ["--top-infill-extrusion-width", o.topInfillExtrusionWidth],
    ["--support-material-extrusion-width", o.supportMaterialExtrusionWidth],
    ["--bridge-flow-ratio", o.bridgeFlowRatio],

    // Multiple extruder options:
    o.extruderOffset.x || o.extruderOffset.y
      ? ["--extruder-offset", o.extruderOffset.x + "x" + o.extruderOffset.y]
      : [],
    ["--perimeter-extruder", o.perimeterExtruder],
    ["--infill-extruder", o.infillExtruder],
    //'--solid-infill-extruder ' + o.solidInfillExtruder,
    ["--support-material-extruder", o.supportMaterialExtruder],
    ["--support-material-interface-extruder"],
    o.supportMaterialInterfaceExtruder,
    o.oozePrevention ? "--ooze-prevention" : [],
    ["--standby-temperature-delta", o.standbyTemperatureDelta],
    o.inputFile ? o.inputFile : [],
    Array.isArray(o.inputFiles) ? o.inputFiles : [],
  ].flat()
}

export async function render(options: Record<string, any>): Promise<string> {
  let useTemporaryOutputFile = false
  let cmdArgs
  let originalOutputFile: string | null = null

  if (!options.outputFile || !options.header) {
    useTemporaryOutputFile = true
    originalOutputFile = options.outputFile
    options.outputFile = temp.path({ suffix: ".gcode" })
  }

  const validationResult = tv4.validateResult(options, configSchema, true)

  if (!validationResult.valid) {
    throw new Error(validationResult.error.message)
  }

  options = applyDefaults(jsonSchemaDefaults(clone(configSchema)), options)

  cmdArgs = getcmdArgs(options)

  if (options.verbose) {
    console.debug(cmdArgs)
  }

  const res = await execFileAsync(
    os.platform() === "darwin"
      ? "/Applications/PrusaSlicer.app/Contents/MacOS/PrusaSlicer"
      : "prusa-slicer",
    cmdArgs
  )

  if (res.stderr) {
    throw new Error(res.stderr)
  }

  if (useTemporaryOutputFile) {
    const outContent = await fs.readFile(options.outputFile)

    if (!options.header && originalOutputFile) {
      // Remove header (54 ASCII characters long) and write file back
      await fs.writeFile(originalOutputFile, outContent.subarray(55), {
        encoding: "utf-8",
      })
    }

    await fs.unlink(options.outputFile)
    return outContent.toString()
  }

  return res.stdout
}
