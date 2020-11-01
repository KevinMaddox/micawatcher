// TODO: Adding new variable uncollapses existing list, add object that keeps track of which are collapsed

/**
  * MicaWatcher
  * JavaScript object-watching widget
  *
  * Wally Chantek, 2020
  * https://github.com/wallychantek/micawatcher
  */

class MicaWatcher {
    isMicaWatcher;    // Indicator to prevent watchers from being watched.
    
    watchedObjs;      // The data being watched.
    elems;            // References to watcher's various DOM elements.
    
    updateInterval;   // Updates the visual display of the watched data.
    updateFrameRate;  // The visual update rate in FPS.
    isPaused;         // Whether the watcher is running or paused.
    statusMsgTimeout; // Clears status message after some time.
    isGrabbable;      // Prevents grabbing when touching title-bar buttons.
    isBeingGrabbed;   // Whether the watcher is being moved by the user.
    grabOffset;       // Used for positioning when being grabbed.
    restoredHeight;   // Used for restoring height after minimizing.
    
    isDisabled;       // Whether the watcher ignores watch/unwatch commands.
    
    /**
      * Class constructor.
      *
      * @param {boolean} isEnabled         - Enables or disables the watcher.
      * @param {object}  options           - Instance configuration options.
      * @param {string}  options.name      - Instance's title bar name.
      * @param {string}  options.fps       - Refresh rate for data display.
      * @param {string}  options.startAuto - Starts/stops instance on creation.
      * @param {string}  options.width     - Starting width of instance.
      * @param {string}  options.height    - Starting height of instance.
      * @param {string}  options.x         - Starting x position of instance.
      * @param {string}  options.y         - Starting y position of instance.
      */
    constructor(isEnabled = true, options = {}) {
        // Handle enabling/disabling of watcher. -------------------------------
        if (typeof isEnabled !== 'boolean') {
            this.report(
                'Warning',
                'Enable/disable toggle must be passed in as a boolean.'
            );
            isEnabled = true;
        }
        
        this.isDisabled = !isEnabled;
        if (this.isDisabled)
            return;
        
        // - Validate configuration options. -----------------------------------
        if (typeof options !== 'object') {
            this.report(
                'Warning',
                'Configuration options must be passed in as an object.'
            );
            options = {};
        }
        
        let validOptions = {
            'name':      ['string' , 'MicaWatcher'],
            'fps':       ['number' , 30           ],
            'startAuto': ['boolean', true         ],
            'width':     ['number' , 320          ],
            'height':    ['number' , 240          ],
            'x':         ['number' , 24           ],
            'y':         ['number' , 24           ]
        }
        
        // Perform validation.
        for (const key in options) {
            // Ensure key is allowed.
            if (!validOptions.hasOwnProperty(key)) {
                this.report('Warning', `Invalid option "${key}".`);
                continue;
            }
            
            // Ensure value is of a valid type.
            if (typeof options[key] !== validOptions[key][0]) {
                this.report(
                    'Warning',
                    `Invalid value for option "${key}". `
                  + `Value must be of type "${validOptions[key][0]}" `
                  + `but was of type "${(typeof options[key])}". `
                  + `Defaulting value to "${validOptions[key][1]}".`
                );
                options[key] = validOptions[key][1];
            }
        }
        
        // Set default values for unspecified options.
        for (const key in validOptions) {
            if (!options.hasOwnProperty(key))
                options[key] = validOptions[key][1];
        }
        
        // - Initialize variables. ---------------------------------------------
        this.isMicaWatcher = true;
        this.watchedObjs = {};
        this.elems = {};
        this.updateFrameRate = options.fps;
        this.isPaused = options.startAuto;
        this.isGrabbable = true;
        this.isBeingGrabbed = false;
        this.grabOffset = {
            x: 0,
            y: 0
        }
        this.restoredHeight = options.height;
        
        
        // - Set up and get references to DOM elements. ------------------------
        this.elems.watcher = document.createElement('div');
        this.elems.watcher.className = 'micawatcher';
        this.elems.watcher.innerHTML =
            '<div class="micawatcher-title-bar">'
          +     '<h1>MicaWatcher</h1>'
          +     '<div class="micawatcher-minimize-button micawatcher-button">'
          +         '<div></div>'
          +     '</div>'
          + '</div>'
          + '<div class="micawatcher-items"></div>'
          + '<div class="micawatcher-add-data-bar">'
          +     '<input '
          +     'type="text" '
          +     'class="micawatcher-obj-name-field" '
          +     'placeholder="Object Variable Name"'
          +     '>'
          +     '<input '
          +     'type="text" '
          +     'class="micawatcher-display-name-field" '
          +     'placeholder="Display Name"'
          +     '>'
          +     '<div class="micawatcher-add-object-button micawatcher-button">'
          +         'Add'
          +     '</div>'
          + '</div>'
          + '<div class="micawatcher-status-bar">'
          +     '<div class="micawatcher-pause-button"></div>'
          +     '<div class="micawatcher-pause-status"></div>'
          +     '<div class="micawatcher-general-status"></div>'
          + '</div>'
        ;
        this.elems.watcher.style.width  = `${options.width}px`;
        this.elems.watcher.style.height = `${options.height}px`;
        this.elems.watcher.style.left   = `${options.x}px`;
        this.elems.watcher.style.top    = `${options.y}px`;
        document.body.appendChild(this.elems.watcher);
        
        this.elems.titleBar = this.elems.watcher.getElementsByClassName(
            'micawatcher-title-bar'
        )[0];
        this.elems.titleBar.getElementsByTagName('h1')[0].innerHTML =
            options.name;
        
        this.elems.itemContainer = this.elems.watcher.getElementsByClassName(
            'micawatcher-items'
        )[0];
        
        this.elems.addDataBar = this.elems.watcher.getElementsByClassName(
            'micawatcher-add-data-bar'
        )[0];
        
        this.elems.statusBar = this.elems.watcher.getElementsByClassName(
            'micawatcher-status-bar'
        )[0];
        
        this.elems.itemDataDisplays = [];
        
        this.elems.objNameField = this.elems.watcher.getElementsByClassName(
            'micawatcher-obj-name-field'
        )[0];
        this.elems.displayNameField = this.elems.watcher.getElementsByClassName(
            'micawatcher-display-name-field'
        )[0];
        
        this.elems.pauseButton = this.elems.watcher.getElementsByClassName(
            'micawatcher-pause-button'
        )[0];
        
        this.elems.pauseStatus = this.elems.watcher.getElementsByClassName(
            'micawatcher-pause-status'
        )[0];
        this.elems.generalStatus = this.elems.watcher.getElementsByClassName(
            'micawatcher-general-status'
        )[0];
        
        let minimizeButtonElem = this.elems.watcher.getElementsByClassName(
            'micawatcher-minimize-button'
        )[0];
        let addObjectButtonElem = this.elems.watcher.getElementsByClassName(
            'micawatcher-add-object-button'
        )[0];
        
        // - Set up event listeners. -------------------------------------------
        this.elems.titleBar.addEventListener('mousedown', function() {
            if (event.button === 0 && this.isGrabbable) {
                let rect = this.elems.watcher.getBoundingClientRect();
                this.grabOffset.x = event.x - rect.left;
                this.grabOffset.y = event.y - rect.top;
                this.isBeingGrabbed = true;
            }
        }.bind(this));
        
        document.addEventListener('mouseup', function() {
            if (event.button === 0)
                this.isBeingGrabbed = false;
        }.bind(this));
        
        document.addEventListener('mousemove', function() {
            if (this.isBeingGrabbed) {
                this.elems.watcher.style.left =
                    Math.max(event.x - this.grabOffset.x, 0) + 'px';
                this.elems.watcher.style.top =
                    Math.max(event.y - this.grabOffset.y, 0) + 'px';
            }
        }.bind(this));
        
        minimizeButtonElem.addEventListener('click', function() {
            // Get all elements below title bar.
            let elems = [
                this.elems.itemContainer,
                this.elems.addDataBar,
                this.elems.statusBar
            ];
            
            // Toggle visibility of elements.
            for (const elem of elems) {
                if (elem.style.display === 'none') {
                    elem.style.display = 'flex';
                }
                else {
                    this.restoredHeight = this.elems.watcher.offsetHeight;
                    elem.style.display = 'none';
                }
            }
            
            // Set CSS properties based on visibility.
            if (elems[0].style.display === 'none') {
                this.elems.titleBar.style.border = 'none';
                this.elems.watcher.style.height = 'auto';
                this.elems.watcher.style.minHeight = 'auto';
                this.elems.watcher.style.resize = 'none';
            }
            else {
                this.elems.titleBar.style.removeProperty('border');
                this.elems.watcher.style.height = this.restoredHeight + 'px';
                this.elems.watcher.style.minHeight = '240px';
                this.elems.watcher.style.resize = 'both';
            }
        }.bind(this));
        
        minimizeButtonElem.addEventListener('mouseover', function() {
            this.isGrabbable = false;
        }.bind(this));
        
        minimizeButtonElem.addEventListener('mouseout', function() {
            this.isGrabbable = true;
        }.bind(this));
        
        this.elems.objNameField.addEventListener(
            'keydown',
            this.addItem.bind(this)
        );
        
        this.elems.displayNameField.addEventListener(
            'keydown',
            this.addItem.bind(this)
        );
        
        addObjectButtonElem.addEventListener(
            'click',
            this.addItem.bind(this)
        );
        
        this.elems.pauseButton.addEventListener('click', function() {
            // Pause
            if (!this.isPaused) {
                clearInterval(this.updateInterval);
                for (const key in this.elems.itemDataDisplays) {
                    this.elems.itemDataDisplays[key].classList.remove(
                        'micawatcher-unselectable'
                    );
                }
                this.elems.pauseStatus.innerHTML = 'Paused';
                this.elems.pauseButton.classList.remove(
                    'micawatcher-pause-button-paused'
                );
            }
            // Resume
            else {
                for (const key in this.elems.itemDataDisplays) {
                    this.elems.itemDataDisplays[key].classList.add(
                        'micawatcher-unselectable'
                    );
                }
                this.elems.pauseStatus.innerHTML = 'Active';
                this.updateInterval = setInterval(
                    this.updateDisplay.bind(this),
                    1000 / this.updateFrameRate
                );
                this.elems.pauseButton.classList.add(
                    'micawatcher-pause-button-paused'
                );
            }
            
            this.isPaused = !this.isPaused;
        }.bind(this));
        
        // Start watcher.
        this.elems.pauseButton.click();
    }
    
    /**
      * Adds an object to the instance's watch list.
      *
      * @param {object} objToWatch - The object to be watched.
      * @param {string} key        - The desired display name for the object.
      */
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
        this.elems.objNameField.value = '';
        this.elems.displayNameField.value = '';
        
        // Set focus back to object name field if appropriate.
        if (document.activeElement === this.elems.displayNameField)
            this.elems.objNameField.focus();
    }
    
    /**
      * Removes an object from the instance's watch list.
      *
      * @param {string} key - The display name used to identify the object.
      */
    unwatch(key) {
        // Don't do anything if watcher is disabled.
        if (this.isDisabled)
            return;
        
        // Remove pointer to object.
        delete this.watchedObjs[key];
        
        // Update display with new object list.
        this.refreshItemList();
    }
    
    /**
      * Specifies an item to be watched via the instance's UI inputs.
      */
    addItem() {
        // Stop if user hit a key other than enter.
        if (event.type === 'keydown' && event.keyCode !== 13) {
            return;
        }
        
        // Initialize variables.
        let obj;
        let objName = '' + this.elems.objNameField.value;
        let objKey = '' + this.elems.displayNameField.value;
        
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
            obj = eval(this.elems.objNameField.value);
        }
        catch (e) {
            this.report('Error', e.message);
            return;
        }
        
        // Add object to watch list.
        this.watch(obj, objKey);
    }
    
    /**
      * Repopulates the watched-object display list.
      */
    refreshItemList() {
        // Reset currently-displayed elements.
        for (const key in this.elems.itemDataDisplays)
            delete this.elems.itemDataDisplays[key];
        this.elems.itemContainer.innerHTML = '';
        
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
            newItem.innerHTML += (!this.isPaused) ? '<p class="micawatcher-unselectable"></p>' : '<p></p>';
            this.elems.itemContainer.appendChild(newItem);
            
            // Store reference to item's data container.
            this.elems.itemDataDisplays[key] = newItem.getElementsByTagName('p')[0];
        }
        
        // Add listeners for minimize & remove buttons.
        let newItems = this.elems.itemContainer.getElementsByClassName('micawatcher-item');
        for (const item of newItems) {
            item.getElementsByClassName('micawatcher-minimize-button')[0].addEventListener('click', this.minimizeItem);
            item.getElementsByClassName('micawatcher-remove-button')[0].addEventListener('click', this.unwatch.bind(this, item.getAttribute('data-key')));
        }
        
        // Force data display update.
        this.updateDisplay();
    }
    
    /**
      * Shows current data in the watched-object display list.
      */
    updateDisplay() {
        for (const key in this.elems.itemDataDisplays)
            this.elems.itemDataDisplays[key].innerHTML = JSON.stringify(this.watchedObjs[key], null, 2);
    }
    
    /**
      * Minimizes or restores the display for a watched object.
      */
    minimizeItem() {
        let elem = this.parentNode.nextSibling;
        
        if (elem.style.display === 'none')
            elem.style.display = 'block';
        else
            elem.style.display = 'none';
    }
    
    /**
      * Clears the UI's status message.
      */
    clearStatusMessage() {
        this.elems.generalStatus.innerHTML = '';
    }
    
    /**
      * Logs a message to the console while also displaying a notice in the UI.
      *
      * @param {string} level - The severity level (completely arbitrary).
      * @param {string} msg   - The message to log to the console.
      */
    report(level, msg) {
        console.log('MicaWatcher ' + level + ': ' + msg);
        if (this.elems.generalStatus)
            this.elems.generalStatus.innerHTML = 'Error! Please check console.';
        
        window.clearTimeout(this.statusMsgTimeout);
        this.statusMsgTimeout = window.setTimeout(this.clearStatusMessage.bind(this), 3000);
    }
}


