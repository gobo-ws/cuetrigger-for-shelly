// CueTrigger for Shelly
// Shelly Plus i4 switch/pushbutton to Interactive Technologies CueServer
// Copyright © 2024 Johan Nilsson - https://gobo.ws. All rights reserved.
// Interactive Technologies and Shelly are trademarks of their respective owners.
//
// Use the following URL to update a KVS variable on a Shelly device (this example sets Cue with ID 2 to 32):
// http://<hostname/ip>/rpc/KVS.Set?key="cs_cueId2"&value="32"
//
// Restart the script after updating a KVS variable:
// Stop script 1:
// http://<hostname/ip>/rpc/Script.Stop?id=1
//
// Start script 1:
// http://<hostname/ip>/rpc/Script.Start?id=1
//
//
// Default configuration
let defaultConfig = {
    cs_hostname: '192.168.33.2', // CueServer hostname/IP
    cs_mode: 'switch', // Options: 'switch' or 'pushbutton'
    // Cue IDs for each switch/pushbutton
    cs_cueId1: 1, // Cue ID for switch/pushbutton 1
    cs_cueId2: 2, // Cue ID for switch/pushbutton 2
    cs_cueId3: 3, // Cue ID for switch/pushbutton 3
    cs_cueId4: 4  // Cue ID for switch/pushbutton 4
};

// Load configuration from KVS or fallback to default
function loadConfigFromKVS() {
    CONFIG = Object.assign({}, defaultConfig);
    let keys = Object.keys(defaultConfig);
    
    let loadNextConfig = function(index) {
        if (index < keys.length) {
            let key = keys[index];
            Shelly.call("KVS.Get", { key: key }, function (result, error_code, error_message) {
                if (error_code === 0 && result.value) {
                    CONFIG[key] = result.value;
                } else {
                    Shelly.call("KVS.Set", { key: key, value: defaultConfig[key] });
                }
                loadNextConfig(index + 1);
            });
        } else {
            runCueTrigger();
        }
    };
    
    loadNextConfig(0);
}

// Save configuration to KVS
function saveConfigToKVS() {
    let keys = Object.keys(CONFIG);
    keys.forEach(function(key) {
        Shelly.call("KVS.Set", { key: key, value: CONFIG[key] }, function (result, error_code, error_message) {
            if (error_code === 0) {
                print("Configuration saved to KVS: " + key);
            } else {
                print("Error saving config to KVS: " + key + ", " + error_message);
            }
        });
    });
}

// Construct the API URL
function getApiUrl(cueId, action) {
    let url = 'http://' + CONFIG.cs_hostname + '/exe.cgi?cmd=Cue+' + cueId + '+' + action;
    return url;
}

// Send commands based on switch state
function sendCueCommand(switchId, state) {
    let cueId = CONFIG['cs_cueId' + switchId];
    let action = state ? 'Go' : 'Stop';
    let url = getApiUrl(cueId, action);
    print((state ? 'Triggering' : 'Stopping') + ' cue: ' + cueId);
    
    Shelly.call("http.request", { method: "GET", url: url }, function (result, error_code, error_message) {
        if (error_code === 0) {
            print("CueServer response: " + result.body);
        } else {
            print("Error: " + error_message);
        }
    });
}

// Trigger a cue in pushbutton mode
function triggerCue(switchId) {
    let cueId = CONFIG['cs_cueId' + switchId];
    let url = getApiUrl(cueId, 'Go');
    print('Triggering cue: ' + cueId);
    
    Shelly.call("http.request", { method: "GET", url: url }, function (result, error_code, error_message) {
        if (error_code === 0) {
            print("CueServer response: " + result.body);
        } else {
            print("Error: " + error_message);
        }
    });
}

// Event handler for input events
Shelly.addEventHandler(function (event) {
    if (event.name === 'input') {
        if (CONFIG.cs_mode === 'switch') {
            if (event.info && event.info.state !== undefined) {
                sendCueCommand(event.id + 1, event.info.state);
            }
        } else if (CONFIG.cs_mode === 'pushbutton' && event.info.state === true) {
            triggerCue(event.id + 1);
        }
    }
});

// Initialize the script
function runCueTrigger() {
    print("CueTrigger for Shelly is running in " + CONFIG.cs_mode + " mode. CueServer: " + CONFIG.cs_hostname);
}

// Loading the configuration
loadConfigFromKVS();
