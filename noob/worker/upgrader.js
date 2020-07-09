// Upgrader Worker Behavior

var _ = require("lodash")

var states = {
    IDLE: "idle",
    UPGRADING: "upgrading",
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
                // If full, start upgrading
                creep.memory.status = states.UPGRADING;
                creep.memory.range = 3;
                creep.log("Status Change: UPGRADING", "UPGRADING");
            }
            else {
                // If not full, start gathering
                creep.memory.status = states.GATHERING;
                creep.memory.range = 1;
                creep.log("Status Change: GATHERING", "GATHERING");
            }
        }

        if (creep.memory.status == states.UPGRADING) {
            if (creep.memory.destination == null) {
                // Set destination, if needed
                creep.memory.destination = creep.memory.target;
                creep.log("Destination set to my upgrading site");
            }

            if (creep.store.getUsedCapacity() == 0) {
                // If empty, stop upgrading
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

            if (creep.pos.inRangeTo(destination.pos, creep.memory.range)) {
                if (creep.memory.status == states.UPGRADING) {
                    creep.upgradeController(destination);
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
                            stroke: '#80f',
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