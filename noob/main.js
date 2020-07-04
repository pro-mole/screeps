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

        let creeps = _.filter(Game.creeps, (creep) => !creep.spawning);
        _.forEach(_.filter(creeps, (creep) => !creep.memory.initialized),
            (creep) => creep.init()
        );

        _.remove(creeps, (creep) => !creep.memory.initialized)
        _.forEach(creeps, (creep) => creep.assess());
        _.forEach(creeps, (creep) => creep.run());

        Coordinator.cleanup();
    }
}