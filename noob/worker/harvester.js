// Harvester Worker Behavior

var _ = require("lodash")

var states = {
    IDLE: "idle",
    HARVESTING: "harvesting",
    DUMPING: "dumping"
};

module.exports = {
    init: function (creep) {
        creep.memory.status = states.IDLE;
        creep.memory.initialized = true;
    },
    assess: function (creep) {
        if (creep.memory.status == states.IDLE) {
            if (creep.store.getFreeCapacity() == 0) {
                // If full, start dumping
                creep.memory.status = states.DUMPING;
                creep.log("Status Change: DUMPING", "DUMPING");
            }
            else {
                // If not full, start harvesting
                creep.memory.status = states.HARVESTING;
                creep.log("Status Change: HARVESTING", "HARVESTING");
            }
        }

        if (creep.memory.status == states.HARVESTING) {
            if (creep.memory.destination == null) {
                // Set destination, if needed
                creep.memory.destination = creep.memory.target;
                creep.log("Destination set to my source");
            }

            if (creep.store.getFreeCapacity() == 0) {
                // If full, stop harvesting
                creep.memory.destination = null;
                creep.memory.status = states.IDLE;
                creep.log("Status Change: IDLE", "IDLE");
            }
        }

        if (creep.memory.status == states.DUMPING) {
            if (creep.memory.destination == null) {
                // Set destination, if needed
                creep.memory.destination = this.findFreeStorage(creep);
                creep.log("Destination set to " + creep.memory.destination);
            }

            if (creep.store.getFreeCapacity() > 0) {
                // If not full, go harvest some more
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
                if (creep.memory.status == states.HARVESTING) {
                    creep.harvest(destination);
                }

                if (creep.memory.status == states.DUMPING) {
                    creep.transfer(destination, RESOURCE_ENERGY);
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
    findFreeStorage: function (creep) {
        // Look for the closest storage to dump energy in
        // Priority 1 - Extensions and Spawns
        let availableStorages = creep.room.find(FIND_MY_STRUCTURES, {
            filter: (structure) => structure.structureType == STRUCTURE_EXTENSION ||
                structure.structureType == STRUCTURE_SPAWN
        });
        _.remove(availableStorages, (storage) => storage.store.getFreeCapacity(RESOURCE_ENERGY) == 0);

        // Priority 2 - Containers and Storage
        if (availableStorages.length == 0) {
            availableStorages = creep.room.find(FIND_MY_STRUCTURES, {
                filter: (structure) => structure.structureType == STRUCTURE_CONTAINER ||
                    structure.structureType == STRUCTURE_STORAGE
            });
            _.remove(availableStorages, (storage) => storage.store.getFreeCapacity(RESOURCE_ENERGY) == 0);
        }

        var closestStorage = creep.pos.findClosestByPath(availableStorages);
        if (closestStorage != undefined) return closestStorage.id;
    }
}