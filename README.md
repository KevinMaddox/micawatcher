# MicaWatcher
MicaWatcher is a JavaScript object-watching widget.
## Installation
Simply include `micawatcher.js` and `micawatcher.css` in the page you wish to use it on.
## Usage Example
```
let sampleObject = {
    'a': 1,
    'b': 2
};

let myWatcher = new MicaWatcher(true, {
    'fps': 30,
    'x': 100,
    'y': 100
});

myWatcher.watch(sampleObject, 'My Sample Object');
```
## Specification
### Class Declaration
```
MicaWatcher(isEnabled, options)
```
### Arguments
| Arugment | Type | Def. Value | Description |
| --- | --- | --- | --- |
| isEnabled | boolean | true | Enables or disables the watcher. Disabling the watcher will render calls to watch() and unwatch() useless, preventing the need to comment out lines of code. |
| options | object | See: Options | Configuration options for initializing instances. |
### Configuration Options
| Option | Type | Def. Value | Description |
| --- | --- | --- | --- |
| name | string | MicaWatcher | The name that appears in the instance's title bar. |
| fps | number | 30 | The rate at which the watched-data list updates (measured in frames per second). |
| startAuto | boolean | true | Whether the watcher should display data in real time upon creation. |
| width | number | 320 | The starting width of the instance, measured in pixels. |
| height | number | 240 | The starting height of the instance, measured in pixels. |
| x | number | 24 | The starting x position of the instance, measured in pixels. |
| y | number | 24 | The starting y position of the instance, measured in pixels. |
### Member Functions
#### watch(objToWatch, key)
## Notes
All variables set to be watched must be Objects. Because references and pointers aren't explicitly available in JavaScript (outside of how Objects are accessed), MicaWatcher cannot watch other data types, such as Numbers or Strings.
You may create multiple watcher instances.