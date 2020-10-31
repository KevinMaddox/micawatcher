/*
    TODO:
    - Add icon after we've written up the readme and made logo and stuff.
*/

class MicaWatcher {
    isMicaWatcher;      // Indicator to prevent watchers from being watched.
    
    watchedObjs;        // The data being watched.
    
    overlayElem;        // The parent container of the watcher.
    titleBarElem;       // The title bar of the watcher window.
    itemContainerElem;  // The container for the items being displayed.
    itemDisplayElems;   // The display item data divs.
    objectInputElem;    // The text input field for adding a new object by name.
    keyInputElem;       // The text input field for new object keys.
    statusButtonElem;   // Pauses or resumes watcher on click.
    toggleStatusElem;   // Displays whether the watcher is running or paused.
    generalStatusElem;  // Displays info (like error notices and such).
    
    updateInterval;     // Updates the visual display of the watched data.
    updateRate;         // The visual update rate in FPS.
    isRunning;          // Whether the watcher is running or paused.
    statusTimeout;      // Clears status message after some time.
    
    isGrabbable;        // Prevents grabbing when touching title-bar buttons.
    isBeingGrabbed;     // Whether the watcher is being moved by the user.
    grabOffsetX;        // Used for positioning when being grabbed.
    grabOffsetY;        // Used for positioning when being grabbed.
    
    lastHeight;         // Used for restoring height after minimizing.
    
    isDisabled;         // Whether the watcher ignores watch/unwatch commands.
    
    options;
    
    constructor(isEnabled = true, options = {}) {
        // Validate enable/disable toggle.
        if (typeof isEnabled !== 'boolean') {
            this.report('Warning', 'Enable/disable toggle must be passed in as a boolean.');
            isEnabled = true;
        }
            
        // Don't initialize anything if watcher is disabled.
        this.isDisabled = !isEnabled;
        if (this.isDisabled)
            return;
        
        // Validate configuration options.
        if (typeof options !== 'object') {
            this.report('Warning', 'Configuration options must be passed in as an object.');
            options = {};
        }
        this.validateOptions(options);
        
        // Initialize variables.
        this.isMicaWatcher = true;
        this.watchedObjs = {};
        this.updateRate = options.fps;
        this.isRunning = !options.startAuto;
        this.isGrabbable = true;
        this.isBeingGrabbed = false;
        this.grabOffsetX = 0;
        this.grabOffsetY = 0;
        this.lastHeight = 0;
        
        // Set up & get references to DOM elements.
        this.overlayElem = document.createElement('div');
        this.overlayElem.className = 'micawatcher';
        this.overlayElem.innerHTML =
            '<div class="micawatcher-title-bar">'
          +     '<h1>MicaWatcher</h1>'
          +     '<div class="micawatcher-minimize-button micawatcher-button"><div></div></div>'
          + '</div>'
          + '<div class="micawatcher-items"></div>'
          + '<div class="micawatcher-add-controls">'
          +     '<input type="text" class="micawatcher-add-input-obj" placeholder="Variable Name">'
          +     '<input type="text" class="micawatcher-add-input-key" placeholder="Display Name">'
          +     '<div class="micawatcher-add-button micawatcher-button">Add</div>'
          + '</div>'
          + '<div class="micawatcher-toggle-controls">'
          +     '<div class="micawatcher-toggle-button"></div>'
          +     '<div class="micawatcher-toggle-status"></div>'
          +     '<div class="micawatcher-general-status"></div>'
          + '</div>'
        ;
        this.overlayElem.style.width = options.width + 'px';
        this.overlayElem.style.height = options.height + 'px';
        this.overlayElem.style.left = options.x + 'px';
        this.overlayElem.style.top = options.y + 'px';
        document.body.appendChild(this.overlayElem);
        // The title bar
        this.titleBarElem = this.overlayElem.getElementsByClassName('micawatcher-title-bar')[0];
        this.titleBarElem.getElementsByTagName('h1')[0].innerHTML = options.name;
        // The container holding the data items
        this.itemContainerElem = this.overlayElem.getElementsByClassName('micawatcher-items')[0];
        // The data item readouts
        this.itemDisplayElems = [];
        // The object-adding input field
        this.objectInputElem = this.overlayElem.getElementsByClassName('micawatcher-add-input-obj')[0];
        this.keyInputElem = this.overlayElem.getElementsByClassName('micawatcher-add-input-key')[0];
        // Pause / resume button
        this.statusButtonElem = this.overlayElem.getElementsByClassName('micawatcher-toggle-button')[0];
        if (options.startAuto)
            this.statusButtonElem.classList.add('micawatcher-toggle-button-pause');
        // The status text (active or paused)
        this.toggleStatusElem = this.overlayElem.getElementsByClassName('micawatcher-toggle-status')[0];
        this.generalStatusElem = this.overlayElem.getElementsByClassName('micawatcher-general-status')[0];
        // The minimize watcher button
        let minimizeButtonElem = this.overlayElem.getElementsByClassName('micawatcher-minimize-button')[0];
        // The add new object button
        let addButtonElem = this.overlayElem.getElementsByClassName('micawatcher-add-button')[0];
        
        // Set up event listeners for grabbing and moving watcher.
        this.overlayElem.getElementsByClassName('micawatcher-title-bar')[0].addEventListener('mousedown', this.grab.bind(this));
        document.addEventListener('mouseup', this.unGrab.bind(this));
        document.addEventListener('mousemove', this.move.bind(this));
        minimizeButtonElem.addEventListener('mouseover', this.setGrabbableState.bind(this, false));
        minimizeButtonElem.addEventListener('mouseout', this.setGrabbableState.bind(this, true));
        
        // Set up event listeners for buttons.
        minimizeButtonElem.addEventListener('click', this.minimizeWatcher.bind(this));
        addButtonElem.addEventListener('click', this.addItem.bind(this));
        this.statusButtonElem.addEventListener('click', this.toggle.bind(this));
        
        // Set up event listeners for input fields.
        this.objectInputElem.addEventListener('keydown', this.triggerAddItem.bind(this));
        this.keyInputElem.addEventListener('keydown', this.triggerAddItem.bind(this));
        
        this.options = options;
        
        // Start watcher.
        this.toggle();
    }
    
    validateOptions(options) {
        // List of valid options, their required types, and their default values.
        let validOptions = {
            'name':               ['string' , 'MicaWatcher'],
            'fps':                ['number' ,  30          ],
            'startAuto': ['boolean', true         ],
            'width':              ['number' , 320          ],
            'height':             ['number' , 240          ],
            'x':                  ['number' ,  24          ],
            'y':                  ['number' ,  24          ]
        }
        
        
        // Validate option data.
        for (const key in options) {
            // Ensure key is allowed.
            if (!validOptions.hasOwnProperty(key)) {
                this.report('Warning', 'Invalid option key: "' + key + '".');
                continue;
            }
            
            // Ensure value is of a valid type.
            if (typeof options[key] !== validOptions[key][0]) {
                this.report('Warning', 'Invalid value for option key: "' + key
                  + '". Value must be of type "' + validOptions[key][0] + '" but was of type: "' + (typeof key)
                  + '". Defaulting value to: "' + validOptions[key][1] + '".');
                options[key] = validOptions[key][1];
            }
        }
        
        // Set default values for unspecified options.
        for (const key in validOptions) {
            if (!options.hasOwnProperty(key))
                options[key] = validOptions[key][1];
        }
    }
    
    watch(objToWatch, key) {
        // Don't do anything if watcher is disabled.
        if (this.isDisabled)
            return;
        
        // Validate data.
        if (typeof key !== 'string' || key.length === 0) {
            this.report('Warning', 'Invalid key. Key was of type: "' + (typeof key) + '". Key must be a string.');
            return;
        }
        else if (typeof objToWatch !== 'object') {
            this.report('Warning', 'Data for key: "' + key + '" is of type: "' + (typeof objToWatch) + '". Watched data can only be an object.');
            return;
        }
        else if (this.watchedObjs.hasOwnProperty(key)) {
            this.report('Warning', 'Key "' + key + '" has already been used. Please use a different key or ensure you\'re not accidentally re-adding the same object.');
            return;
        }
        else if (objToWatch.isMicaWatcher) {
            this.report('Warning', 'To prevent cyclic object value errors from occurring, watching a MicaWatcher object is not allowed.');
            return;
        }
        
        // Store pointer to object.
        this.watchedObjs[key] = objToWatch;
        
        // Update display with new object list.
        this.refreshItemList();
        
        // Clear input fields in case we added this through the watcher UI.
        this.objectInputElem.value = '';
        this.keyInputElem.value = '';
        
        // Set focus back to object name field if appropriate.
        if (document.activeElement === this.keyInputElem)
            this.objectInputElem.focus();
    }
    
    unwatch(key) {
        // Don't do anything if watcher is disabled.
        if (this.isDisabled)
            return;
        
        // Remove pointer to object.
        delete this.watchedObjs[key];
        
        // Update display with new object list.
        this.refreshItemList();
    }
    
    addItem() {
        // Initialize variables.
        let obj;
        let objName = '' + this.objectInputElem.value;
        let objKey = '' + this.keyInputElem.value;
        
        // Validate input fields.
        if (objName.length === 0) {
            this.report('Error', 'Please provide a valid object name.');
            return;
        }
        else if (objKey.length === 0) {
            this.report('Error', 'Please provide a valid display name.');
            return;
        }
        
        // Attempt to retrieve object by name.
        try {
            obj = eval(this.objectInputElem.value);
        }
        catch (e) {
            this.report('Error', e.message);
            return;
        }
        
        // Add object to watch list.
        this.watch(obj, objKey);
    }
    
    triggerAddItem() {
        if (event.keyCode === 13) {
            this.addItem();
        }
    }
    
    refreshItemList() {
        // Reset currently-displayed elements.
        for (const key in this.itemDisplayElems)
            delete this.itemDisplayElems[key];
        this.itemContainerElem.innerHTML = '';
        
        // Create new display items for watched data.
        for (const key in this.watchedObjs) {
            // Create DOM element.
            let newItem = document.createElement('div');
            newItem.classList.add('micawatcher-item');
            newItem.setAttribute('data-key', key);
            newItem.innerHTML =
                '<div>'
              +     '<h2>' + key + '</h2>'
              +     '<div class="micawatcher-minimize-button micawatcher-button"><div></div></div>'
              +     '<div class="micawatcher-remove-button micawatcher-button"><div></div></div>'
              + '</div>'
            ;
            newItem.innerHTML += (this.isRunning) ? '<p class="micawatcher-unselectable"></p>' : '<p></p>';
            this.itemContainerElem.appendChild(newItem);
            
            // Store reference to item's data container.
            this.itemDisplayElems[key] = newItem.getElementsByTagName('p')[0];
        }
        
        // Add listeners for minimize & remove buttons.
        let newItems = this.itemContainerElem.getElementsByClassName('micawatcher-item');
        for (const item of newItems) {
            item.getElementsByClassName('micawatcher-minimize-button')[0].addEventListener('click', this.minimizeItem);
            item.getElementsByClassName('micawatcher-remove-button')[0].addEventListener('click', this.removeItem.bind(this, item.getAttribute('data-key')));
        }
        
        // Force data display update.
        this.updateDisplay();
    }
    
    updateDisplay() {
        for (const key in this.itemDisplayElems)
            this.itemDisplayElems[key].innerHTML = JSON.stringify(this.watchedObjs[key], null, 2);
    }
    
    toggle() {
        // Pause
        if (this.isRunning) {
            clearInterval(this.updateInterval);
            for (const key in this.itemDisplayElems)
                this.itemDisplayElems[key].classList.remove('micawatcher-unselectable');
            this.toggleStatusElem.innerHTML = 'Paused';
            this.statusButtonElem.classList.remove('micawatcher-toggle-button-pause');
        }
        // Resume
        else {
            for (const key in this.itemDisplayElems)
                this.itemDisplayElems[key].classList.add('micawatcher-unselectable');
            this.toggleStatusElem.innerHTML = 'Active';
            this.updateInterval = setInterval(this.updateDisplay.bind(this), 1000 / this.updateRate);
            this.statusButtonElem.classList.add('micawatcher-toggle-button-pause');
        }
        
        this.isRunning = !this.isRunning;
    }
    
    grab() {
        if (event.button === 0 && this.isGrabbable) {
            this.grabOffsetX = event.x - this.overlayElem.getBoundingClientRect().left;
            this.grabOffsetY = event.y - this.overlayElem.getBoundingClientRect().top;
            this.isBeingGrabbed = true;
        }
    }
    
    setGrabbableState(isGrabbable) {
        this.isGrabbable = isGrabbable;
    }
    
    unGrab() {
        if (event.button === 0)
            this.isBeingGrabbed = false;
    }
    
    move() {
        if (this.isBeingGrabbed) {
            this.overlayElem.style.left = Math.max(event.x - this.grabOffsetX, 0) + 'px';
            this.overlayElem.style.top  = Math.max(event.y - this.grabOffsetY, 0) + 'px';
        }
    }
    
    minimizeWatcher() {
        // Get all elements below title bar.
        let elems = [
            this.itemContainerElem,
            this.overlayElem.getElementsByClassName('micawatcher-add-controls')[0],
            this.overlayElem.getElementsByClassName('micawatcher-toggle-controls')[0]
        ];
        
        // Toggle visibility of elements.
        for (const elem of elems) {
            if (elem.style.display === 'none')
                elem.style.display = 'flex';
            else {
                this.lastHeight = this.overlayElem.offsetHeight;
                elem.style.display = 'none';
            }
        }
        
        // Set CSS properties based on whether we've shown or hidden elements.
        if (elems[0].style.display === 'none') {
            this.overlayElem.style.height = 'auto';
            this.overlayElem.style.minHeight = 'auto';
            this.overlayElem.style.resize = 'none';
            this.titleBarElem.style.border = 'none';
        }
        else {
            this.overlayElem.style.height = this.lastHeight + 'px';
            this.overlayElem.style.minHeight = '240px';
            this.overlayElem.style.resize = 'both';
            this.titleBarElem.style.removeProperty('border');
        }
    }
    
    minimizeItem() {
        let elem = this.parentNode.nextSibling;
        
        if (elem.style.display === 'none')
            elem.style.display = 'block';
        else
            elem.style.display = 'none';
    }
    
    removeItem(key) {
        // Remove pointer to object.
        delete this.watchedObjs[key];
        
        // Update display with new object list.
        this.refreshItemList();
    }
    
    report(level, msg) {
        console.log('MicaWatcher ' + level + ': ' + msg);
        if (this.generalStatusElem)
            this.generalStatusElem.innerHTML = 'Error! Please check console.';
        
        window.clearTimeout(this.statusTimeout);
        this.statusTimeout = window.setTimeout(this.clearStatusTimeout.bind(this), 3000);
    }
    
    clearStatusTimeout() {
        this.generalStatusElem.innerHTML = '';
    }
}


