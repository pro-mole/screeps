// Main Module

// Various internal APIs
require("api.worker")

// Import and initialize the modules
var Coordinator = require("coordinator")

module.exports = {
    coordinator: Coordinator,
    loop: function() {
        if (!Coordinator.memory.initialized) {
            Coordinator.init();
        }
        Coordinator.assess();

        for (let creepId in Game.creeps) {
            let creep = Game.creeps[creepId];
            if (!creep.spawning)
            {
                if (!creep.memory.initialized) {
                    creep.init();
                }
                creep.assess();
                creep.run();
            }
        }

        Coordinator.cleanup();
    }
}