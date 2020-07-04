// Main Module

var _ = require('lodash')

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

        _.forEach(Game.creeps, function(creep, name) {
            if (!creep.memory.initialized && !creep.spawning) {
                creep.init();
            }
        });

        _.forEach(Game.creeps, function(creep, name) {
            if (creep.memory.initialized) {
                creep.assess();
            }
        });
        _.forEach(Game.creeps, function(creep, name) {
            if (creep.memory.initialized) {
                creep.run();
            }
        });

        Coordinator.cleanup();
    }
}