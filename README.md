# NodeSlicer

Wrapper for the PrusaSlicer CLI plus additional configuration parameters.


## Installation

```shell
npm install nodeslicer
```


## Usage

```ts
import { render } from "nodeslicer"

const options = {
  inputFile: 'path/to/file.stl'
  // For more options check out the configSchema.yaml file
}

const gcode = render(options)
console.log(gcode)
```
