// Main Module

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
                let workerPrototype = require("worker." + creep.memory.role);
                
                if (!creep.memory.initialized) {
                    workerPrototype.init(creep, creep.memory.target);
                    creep.memory.initialized = true;
                }
                workerPrototype.assess(creep);
                workerPrototype.run(creep);
            }
        }
    }
}