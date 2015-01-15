var nodeSlicer = require('../index.js'),
	path = require('path'),
	assert = require('assert'),
	fs = require('fs')


nodeSlicer.render(
	{
		inputFile: path.join(__dirname, 'cone.stl')
	},
	function (error, dataBuffer) {

		assert.ifError(error)

		assert(Buffer.isBuffer(dataBuffer))

		var bufferString = dataBuffer
				.toString()
				.split('\n')
				.slice(2)
				.join('\n'),
			fileString = String(
				fs.readFileSync(
					path.join(__dirname, 'cone.gcode'),
					{encoding: 'utf-8'}
				)
			)

		// TODO: Fix trailing whitespace issue in slic3r
		assert.equal(
			bufferString + '\n',
			fileString,
			bufferString.length + ' and ' + fileString.length
			+ 'reference Gcode file differ!'
		)
	}
)
