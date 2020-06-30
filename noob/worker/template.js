// Worker Behavior Template

module.exports = {
    // State enum declaration
    // Not very strict, but rather useful
    states: {
        IDLE: "idle"
    },
    // Initialization function
    // The syntax of the function arguments depends on what this worker is meant for
    // Structure Workers: (Target ID)
    // Hauling Workers: (Resource ID)
    init: function(data) {

    },
    // State checking and changing function
    assess: function() {
    },
    // Run behavior bases on status
    run: function() {
        
    }
}