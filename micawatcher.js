/*
    TODO:
    - Clean up CSS
    - Collapsable data display items
    - Pause button
    - Adding new items via input
    - Remove existing items
    - Minimize & close buttons
    - Prettify
*/

class MicaWatcher {
    watchedObjects;     // The data being watched.
    
    overlayElem;        // The parent container of the watcher.
    itemContainerElem;  // The container for the items being displayed.
    itemDisplayElems;   // The display item data divs.
    statusButtonElem;   // Pauses or resumes watcher on click.
    statusElem;         // Displays whether the watcher is running or paused.
    
    updateInterval;     // Updates the visual display of the watched data.
    updateRate;         // The visual update rate in FPS.
    isRunning;          // Whether the watcher is running or paused.
    
    isBeingGrabbed;     // Whether the watcher is being moved by the user.
    grabOffsetX;        // Used for positioning when being grabbed.
    grabOffsetY;        // Used for positioning when being grabbed.
    
    isDisabled;         // Whether the watcher ignores watch/unwatch commands.
    
    constructor(isEnabled = true, options = {}) {
        // Don't initialize anything if watcher is disabled.
        this.isDisabled = !isEnabled;
        if (this.isDisabled)
            return;
        
        this.validateOptions(options);
        
        // Initialize variables.
        this.watchedObjects = {};
        this.updateRate = options.fps;
        this.isRunning = !options.startAutomatically;
        this.isBeingGrabbed = false;
        this.grabOffsetX = 0;
        this.grabOffsetY = 0;
        
        // Set up & get references to DOM elements.
        this.overlayElem = document.createElement('div');
        this.overlayElem.className = 'micawatcher';
        this.overlayElem.innerHTML =
            '<h1>Debug Overlay</h1>'
          + '<div class="micawatcher-items"></div>'
          + '<div class="micawatcher-add-controls">'
          +     '<input type="text" class="micawatcher-add-input" placeholder="Variable Name">'
          +     '<div class="micawatcher-add-button">Add</div>'
          + '</div>'
          + '<div class="micawatcher-pause-controls">'
          +     '<div class="micawatcher-pause-button"></div>'
          +     '<div class="micawatcher-pause-status">Status: Active</div>'
          + '</div>'
        ;
        document.body.appendChild(this.overlayElem);
        this.itemContainerElem = this.overlayElem.getElementsByClassName('micawatcher-items')[0];
        this.itemDisplayElems = [];
        this.statusButtonElem = this.overlayElem.getElementsByClassName('micawatcher-pause-button')[0];
        this.statusElem = this.overlayElem.getElementsByClassName('micawatcher-pause-status')[0];
        
        // Set up event listeners for grabbing and moving watcher.
        this.overlayElem.getElementsByTagName('h1')[0].addEventListener('mousedown', this.grab.bind(this));
        document.addEventListener('mouseup', this.unGrab.bind(this));
        document.addEventListener('mousemove', this.move.bind(this));
        
        // Set up event listener for pausing/unpausing watcher.
        // TODO: Button click listener.
        
        // Start watcher.
        this.toggle();
    }
    
    validateOptions(options) {
        // List of valid options, their required types, and their default values.
        let validOptions = {
            'fps':                ['number' , 30   ],
            'startAutomatically': ['boolean', true]
        }
        
        // Validate option data.
        for (const key in options) {
            // Ensure key is allowed.
            if (!validOptions.hasOwnProperty(key)) {
                console.log('MicaWatcher Warning: Invalid option key: "' + key + '".');
                continue;
            }
            
            // Ensure value is of a valid type.
            if (typeof options[key] !== validOptions[key][0]) {
                console.log('MicaWatcher Warning: Invalid value for option key: "' + key
                  + '". Value must be of type "' + validOptions[key][0] + '" but was of type: "' + (typeof key)
                  + '". Defaulting value to: "' + validOptions[key][1] + '".');
                options[key] = validOptions[key][1];
            }
        }
        
        // Set option defaults.
        for (const key in validOptions) {
            options[key] = options[key] || validOptions[key][1];
        }
    }
    
    watch(dataToWatch, key) {
        // Don't do anything if watcher is disabled.
        if (this.isDisabled)
            return;
        
        // Validate data.
        if (typeof key !== 'string' || key.length === 0) {
            console.log('MicaWatcher Warning: Invalid key. Key was of type: "' + (typeof key) + '". Key must be a string.');
            return;
        }
        else if (typeof dataToWatch !== 'object') {
            console.log('MicaWatcher Warning: Data for key: "' + key + '" is of type: "' + (typeof dataToWatch) + '". Watched data can only be an object.');
            return;
        }
        
        // Store pointer to object.
        this.watchedObjects[key] = dataToWatch;
        
        // Update display with new object list.
        this.refreshItemList();
    }
    
    unWatch(key) {
        // Don't do anything if watcher is disabled.
        if (this.isDisabled)
            return;
        
        // Remove pointer to object.
        delete this.watchedObjects[key];
        
        // Update display with new object list.
        this.refreshItemList();
    }
    
    refreshItemList() {
        // Reset currently-displayed elements..
        this.itemContainerElem.innerHTML = '';
        for (const key in this.itemDisplayElems)
            delete this.itemDisplayElems[key];
        
        // Create new display items for watched data.
        for (const key in this.watchedObjects) {
            // Create DOM element.
            let newItem = document.createElement('div');
            newItem.innerHTML = '<h2>' + key + '</h2>';
            newItem.innerHTML += (this.isRunning) ? '<p class="micawatcher-unselectable"></p>' : '<p></p>';
            this.itemContainerElem.appendChild(newItem);
            
            // Store reference to item's data container.
            this.itemDisplayElems[key] = newItem.getElementsByTagName('p')[0];
        }
        
        // Force data display update.
        this.updateDisplay();
    }
    
    updateDisplay() {
        for (const key in this.itemDisplayElems)
            this.itemDisplayElems[key].innerHTML = JSON.stringify(this.watchedObjects[key], null, 2);
    }
    
    toggle() {
        // Pause
        if (this.isRunning) {
            clearInterval(this.updateInterval);
            for (const key in this.itemDisplayElems)
                this.itemDisplayElems[key].classList.remove('micawatcher-unselectable');
            this.statusElem.innerHTML = 'Status: Paused';
        }
        // Resume
        else {
            for (const key in this.itemDisplayElems)
                this.itemDisplayElems[key].classList.add('micawatcher-unselectable');
            this.statusElem.innerHTML = 'Status: Active';
            this.updateInterval = setInterval(this.updateDisplay.bind(this), 1000 / this.updateRate);
        }
        
        this.isRunning = !this.isRunning;
    }
    
    grab(event) {
        if (event.button === 0) {
            this.grabOffsetX = event.x - this.overlayElem.getBoundingClientRect().left;
            this.grabOffsetY = event.y - this.overlayElem.getBoundingClientRect().top;
            this.isBeingGrabbed = true;
        }
    }
    
    unGrab(event) {
        if (event.button === 0)
            this.isBeingGrabbed = false;
    }
    
    move(event) {
        if (this.isBeingGrabbed) {
            this.overlayElem.style.left = event.x - this.grabOffsetX + 'px';
            this.overlayElem.style.top  = event.y - this.grabOffsetY + 'px';
        }
    }
}
