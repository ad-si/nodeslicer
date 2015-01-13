var fs = require('fs'),
	path = require('path'),
	childProcess = require('child_process'),
	os = require('os'),

	jsonSchemaDefaults = require('json-schema-defaults'),
	yaml = require('js-yaml'),
	clone = require('clone'),
	temp = require('temp'),
	tv4 = require('tv4'),

	applyDefaults = require('./applyDefaults.js'),
	configSchema = yaml.safeLoad(
		fs.readFileSync(path.join(__dirname, 'configSchema.yaml'))
	),
	nodeSlicer = {}


function getBinaryPath () {

	var binPath

	if (os.platform() === 'darwin')
		binPath = '~/Applications/Slic3r.app/Contents/MacOS/slic3r'
	else
		binPath = 'slic3r'

	return binPath
}

function getShellCommand (o) {

	var shellCommand

	o.outputFile = o.outputFile || temp.path({suffix: '.gcode'})

	shellCommand = [
		getBinaryPath(),
		'--output ' + o.outputFile,

		// Non-slicing actions
		o.repair ? '--repair' : '',
		o.cut ? '--cut' : '',
		o.split ? '--split' : '',
		o.info ? '--info' : '',
		'--threads ' + o.threads,

		// Output options
		o.outputFilenameFormat ?
		'--output-filename-format ' + o.outputFilenameFormat : '',
		o.postProcess !== [] ?
		o.postProcessScripts.map(function (script) {
			return '--post-process ' + script
		}).join(' ') : '',
		o.exportSvg ? '--export-svg' : '',
		o.merge ? '--merge' : '',

		// Printer options
		'--nozzle-diameter ' + o.nozzleDiameter,
		'--print-center ' + o.printCenter.x + ',' + o.printCenter.y,
		'--z-offset ' + o.zOffset,
		'--gcode-flavor ' + o.gcodeFlavor,
		o.useRelativeEDistances ? '--use-relative-e-distances ' : '',
		o.useFirmwareRetraction ? '--use-firmware-retraction ' : '',
		o.useVolumetricE ? '--use-volumetric-e ' : '',
		o.gcodeArcs ? '--gcode-arcs' : '',
		o.g0 ? '--g0' : '',
		o.gcodeComments ? '--gcode-comments' : '',
		'--vibration-limit ' + o.vibrationLimit,
		'--pressure-advance ' + o.pressureAdvance,

		// Filament options
		'--filament-diameter ' + o.filamentDiameter,
		'--extrusion-multiplier ' + o.extrusionMultiplier,
		'--temperature ' + o.temperature,
		'--first-layer-temperature ' + o.firstLayerTemperature,
		'--bed-temperature ' + o.bedTemperature,
		'--first-layer-bed-temperature ' + o.firstLayerBedTemperature,

		// Speed options
		'--travel-speed ' + o.travelSpeed,
		'--perimeter-speed ' + o.perimeterSpeed,
		'--small-perimeter-speed ' + o.smallPerimeterSpeed,
		'--external-perimeter-speed ' + o.externalPerimeterSpeed,
		'--infill-speed ' + o.infillSpeed,
		'--solid-infill-speed ' + o.solidInfillSpeed,
		'--top-solid-infill-speed ' + o.topSolidInfillSpeed,
		'--support-material-speed ' + o.supportMaterialSpeed,
		'--support-material-interface-speed ' + o.supportMaterialInterfaceSpeed,
		'--bridge-speed ' + o.bridgeSpeed,
		'--gap-fill-speed ' + o.gapFillSpeed,
		'--first-layer-speed ' + o.firstLayerSpeed,

		// Accelerator options
		'--perimeter-acceleration ' + o.perimeterAcceleration,
		'--infill-acceleration ' + o.infillAcceleration,
		'--bridge-acceleration ' + o.bridgeAcceleration,
		'--first-layer-acceleration ' + o.firstLayerAcceleration,
		'--default-acceleration ' + o.defaultAcceleration,

		// Accuracy options
		'--layer-height ' + o.layerHeight,
		'--first-layer-height ' + o.firstLayerHeight,
		'--infill-every-layers ' + o.infillEveryLayers,
		'--solid-infill-every-layers ' + o.solidInfillEveryLayers,

		// Print Options
		'--perimeters ' + o.perimeters,
		'--top-solid-layers ' + o.topSolidLayers,
		'--bottom-solid-layers ' + o.bottomSolidLayers,
		o.solidLayers ? '--solid-layers' : '',
		'--fill-density ' + o.fillDensity,
		'--fill-angle ' + o.fillAngle,
		'--fill-pattern ' + o.fillPattern,
		'--solid-fill-pattern ' + o.solidFillPattern,
		o.startGcode ? '--start-gcode' : '',
		o.endGcode ? '--end-gcode ' : '',
		o.layerGcode ? '--layer-gcode ' : '',
		o.toolchangeGcode ? '--toolchange-gcode ' : '',
		'--seam-position ' + o.seamPosition,
		o.externalPerimetersFirst ? '--external-perimeters-first ' : '',
		o.spiralVase ? '--spiral-vase ' : '',
		o.onlyRetractWhenCrossingPerimeters ?
			'--only-retract-when-crossing-perimeters ' : '',
		'--solid-infill-below-area ' + o.solidInfillBelowArea,
		o.infillOnlyWhereNeeded ? '--infill-only-where-needed ' : '',
		o.infillFirst ? '--infill-first ' : '',

		// Quality options
		o.extraPerimeters ? '--extra-perimeters' : '',
		o.avoidCrossingPerimeters ? '--avoid-crossing-perimeters' : '',
		o.thinWalls ? '--thin-walls' : '',
		o.overhangs ? '--overhangs' : '',

		// Support material options
		o.supportMaterial ? '--support-material ' : '',
		'--support-material-threshold ' + o.supportMaterialThreshold,
		'--support-material-pattern ' + o.supportMaterialPattern,
		'--support-material-spacing ' + o.supportMaterialSpacing,
		'--support-material-angle ' + o.supportMaterialAngle,
		'--support-material-interface-layers ' + o.supportMaterialInterfaceLayers,
		'--support-material-interface-spacing ' + o.supportMaterialInterfaceSpacing,
		'--raft-layers ' + o.raftLayers,
		'--support-material-enforce-layers ' + o.supportMaterialEnforceLayers,
		o.dontSupportBridges ? '--dont-support-bridges ' : '',

		// Retraction options
		'--retract-length ' + o.retractLength,
		'--retract-speed ' + o.retractSpeed,
		'--retract-restart-extra ' + o.retractRestartExtra,
		'--retract-before-travel ' + o.retractBeforeTravel,
		'--retract-lift ' + o.retractLift,
		o.retractLayerChange ? '--retract-layer-change' : '',
		o.wipe ? '--wipe' : '',

		// Retraction options for multi-extruder setups
		'--retract-length-toolchange ' + o.retractLengthToolchange,
		'--retract-restart-extra-toolchange ' + o.retractRestartExtraToolchange,

		// Cooling options
		o.cooling ? '--cooling ' : ' ',
		'--min-fan-speed ' + o.minFanSpeed,
		'--max-fan-speed ' + o.maxFanSpeed,
		'--bridge-fan-speed ' + o.bridgeFanSpeed,
		'--fan-below-layer-time ' + o.fanBelowLayerTime,
		'--slowdown-below-layer-time ' + o.slowdownBelowLayerTime,
		'--min-print-speed ' + o.minPrintSpeed,
		'--disable-fan-first-layers ' + o.disableFanFirstLayers,
		o.fanAlwaysOn ? '--fan-always-on ' : ''
	]

	return shellCommand.join(' ')
}

nodeSlicer.render = function (options, callback) {

	var validationResult = tv4.validateResult(
		options, configSchema, null, true
	)


	if (!validationResult.valid)
		return console.error(validationResult.error.message)

	options = applyDefaults(jsonSchemaDefaults(clone(configSchema)), options)


	childProcess.exec(
		getShellCommand(options),
		function (error, stdout, stderr) {

			if (error) {
				callback(error)
				return
			}

			if (!options.outputFile)
				fs.readFile(options.outputFile, {}, function (error, data) {

					if (error) {
						callback(error)
						return
					}
					else
						callback(null, data)

					fs.unlink(options.outputFile, function (error) {
						if (error && error.code !== 'ENOENT')
							throw error
					})
				})

			else
				callback()
		}
	)
}


module.exports = nodeSlicer
