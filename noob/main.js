// Main Module

// Import and initialize the modules
var Coordinator = require("coordinator")

module.exports = {
    coordinator: Coordinator,
    loop: function() {
        Coordinator.assess();

        for (creep of Game.creeps) {
            creep.assess();
            creep.run();
        }
    }
}

Coordinator.init();