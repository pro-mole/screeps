// Harvester Worker Behavior

var _ = require("lodash")

var states = {
    IDLE: "idle",
    BUILDING: "building",
    GATHERING: "gathering"
};

module.exports = {
    init: function (creep) {
        creep.memory.status = states.IDLE;
        creep.memory.initialized = true;
    },
    assess: function (creep) {
        if (creep.memory.status == states.IDLE) {
            if (Game.getObjectById(creep.memory.target == undefined)) {
                // If the site doesn't exist anymore...
                creep.log("Nothing to do", "IDLE!");
                return;
            }

            if (creep.store.getFreeCapacity() == 0) {
                // If full, start building
                creep.memory.status = states.BUILDING;
                creep.log("Status Change: BUILDING", "BUILDING");
            }
            else {
                // If not full, start gathering
                creep.memory.status = states.GATHERING;
                creep.log("Status Change: GATHERING", "GATHERING");
            }
        }

        if (creep.memory.status == states.BUILDING) {
            if (creep.memory.destination == null) {
                // Set destination, if needed
                creep.memory.destination = creep.memory.target;
                creep.log("Destination set to my building site");
            }

            if (creep.store.getUsedCapacity() == 0) {
                // If empty, stop building
                creep.memory.destination = null;
                creep.memory.status = states.IDLE;
                creep.log("Status Change: IDLE", "IDLE");
            }
        }

        if (creep.memory.status == states.GATHERING) {
            if (creep.memory.destination == null) {
                // Set destination, if needed
                creep.memory.destination = this.findStorage(creep);
                creep.log("Destination set to " + creep.memory.destination);
            }

            if (creep.store.getFreeCapacity() == 0) {
                // If full, go build
                creep.memory.destination = null;
                creep.memory.status = states.IDLE;
                creep.log("Status Change: IDLE", "IDLE");
            }
        }
    },
    run: function (creep) {
        if (creep.memory.destination != undefined) { // Let's move!
            var destination = Game.getObjectById(creep.memory.destination);

            if (creep.pos.isNearTo(destination.pos)) {
                if (creep.memory.status == states.BUILDING) {
                    creep.build(destination);
                }

                if (creep.memory.status == states.GATHERING) {
                    creep.withdraw(destination, RESOURCE_ENERGY);
                }
            }
            else {
                if (creep.fatigue == 0) {
                    var moveResponse = "";
                    moveResponse = creep.moveTo(destination, {
                        reusePath: 32,
                        visualizePathStyle: {
                            fill: 'transparent',
                            stroke: '#080',
                            lineStyle: 'dashed',
                            strokeWidth: .15,
                            opacity: .2
                        }
                    });
                    if (moveResponse != OK) {
                        creep.log("Movement error " + moveResponse, "ERROR " + moveResponse)
                    }
                }
            }
        }
    },
    findStorage: function (creep) {
        // Look for the closest storage that contains some energy
        // Priority 1 - Containers and Storage
        let availableStorages = creep.room.find(FIND_MY_STRUCTURES, {
            filter: (structure) => structure.structureType == STRUCTURE_CONTAINER ||
            structure.structureType == STRUCTURE_STORAGE
        });
        _.remove(availableStorages, (storage) => storage.store.getUsedCapacity(RESOURCE_ENERGY) == 0);

        // Priority 2 - Spawn
        if (availableStorages.length == 0) {
            availableStorages = creep.room.find(FIND_MY_SPAWNS);
            _.remove(availableStorages, (storage) => storage.store.getUsedCapacity(RESOURCE_ENERGY) == 0);
        }

        var closestStorage = creep.pos.findClosestByPath(availableStorages);
        if (closestStorage != undefined) return closestStorage.id;
    }
}