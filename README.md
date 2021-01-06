# MicaWatcher
MicaWatcher is a JavaScript object-watching widget.
<p align="center"><img src="https://raw.githubusercontent.com/WallyChantek/micawatcher/main/images/img01.png" alt="MicaWatcher Preview"/></p>
## Demo
[MicaWatcher Demo](https://kevinmaddox.github.io/demo/micawatcher/micawatcher.html)
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
| options | object | See: Configuration Options | Configuration options for initializing instances. |
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
### Public Member Functions
#### watch(objToWatch, key)
Adds an object to the instance's watch list.
| Arugment | Type | Description |
| --- | --- | --- |
| objToWatch | object | The object to be added to the watch list. |
| key | string | A meaningful name/key for the object, which will appear in the watch list. |
#### unwatch(key)
Removes an object from the instance's watch list.
| Arugment | Type | Description |
| --- | --- | --- |
| key | string | The name/key previously assigned to the object via watch(). |
## Notes
* All variables set to be watched must be Objects. Because references and pointers aren't explicitly available in JavaScript (outside of how Objects are accessed), MicaWatcher cannot watch other data types, such as Numbers or Strings. Technically, this could be achieved by passing the variable name as a string with the parent object included (myObj.coolVar, player.xSpeed, window.myGlobalVar, etc.) and parsing it all out (storing pointer to parent object and string with target variable's key name), but it's outside the scope of this project and not really needed for my purposes.
* In tandem with the above, creating a new instance of a watched Object (i.e. assigning it to {}) will invalidate the pointer to that object and make the data obsolete, forcing you to re-watch that object. Another caveat of not having proper control over pointers/references. Once again, if you need functionality beyond this, you should find another tool.
* You may create multiple MicaWatcher instances.
* Backwards compatibility was not a focus with this and, as such, I used all sorts of ES6 constructs and keywords in this library. Please ensure you remove the watcher from your code when ready to deploy (you should anyway, given it's a debugging tool).