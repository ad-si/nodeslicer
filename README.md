# NodeSlicer

Node.js wrapper for the Slic3r-cli plus additional configuration parameters.


## Installation

`$ npm install nodeslicer`


## Usage

```
var nodeSlicer = require('nodeslicer'),
    options = {
        inputFile: 'path/to/file'
        // For more options check out the configSchema.yaml file
    }


nodeSlicer.render(options, function (error, bufferData) {
    if (error)
        console.error(error.message)
    else
        console.log(bufferData.toString('utf8'))
})
```
