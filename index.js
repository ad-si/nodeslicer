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

function yesNoify (value) {
	if (value)
		return 'yes'
	else
		return 'no'
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
		'--use-relative-e-distances ' + yesNoify(o.useRelativeEDistances),
		'--use-firmware-retraction ' + yesNoify(o.useFirmwareRetraction),
		'--use-volumetric-e ' + yesNoify(o.useVolumetricE),
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
		'--first-layer-speed ' + o.firstLayerSpeed
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
