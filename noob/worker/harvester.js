// Harvester Worker Behavior

var states = {
    IDLE: "idle",
    MOVING: "moving",
    HARVESTING: "harvesting",
    DUMPING: "dumping"
};

module.exports = {
    init: function(creep, target) {
        creep.memory.status = states.IDLE;
    },
    assess: function(creep) {
        if (creep.memory.status == states.IDLE) {
            if (creep.memory.destination != undefined) {
                // Trace the path to the destination
                creep.memory.status = states.MOVING;
                this.log(creep, "Status Change: MOVING", "MOVING");
            }
            else { this.log(creep, "Stay IDLE"); }
        }
        else if (creep.memory.status == states.MOVING) {
            var destination = Game.getObjectById(creep.memory.destination);
            if (creep.pos.isNearTo(destination.pos)) {
                if (creep.memory.destination == creep.memory.target) {
                    creep.memory.status = states.HARVESTING;
                    this.log(creep, "Status Change: HARVESTING", "HARVESTING");
                }
                else {
                    creep.memory.status = states.DUMPING;
                    this.log(creep, "Status Change: DUMPING", "DUMPING");
                }
            }
        }
        else if (creep.memory.status == states.HARVESTING) {
            if (creep.store.getFreeCapacity() == 0) {
                creep.memory.destination = null;
                creep.memory.status = states.IDLE;
                this.log(creep, "Status Change: IDLE", "IDLE");
            }
        }
        else if (creep.memory.status == states.DUMPING) {
            if (creep.store.getUsedCapacity() == 0) {
                creep.memory.destination = null;
                creep.memory.status = states.IDLE;
                this.log(creep, "Status Change: IDLE", "IDLE");
            }
        }
    },
    run: function(creep) {
        if (creep.memory.status == states.IDLE) {
            // Is it full?
            if (creep.store.getFreeCapacity() == 0) {
                // Do we have somewhere to dump creep?
                if (creep.memory.destination == undefined) {
                    // Find a destination to trace a path towards
                    // Priority 1 - Spawns
                    for (let spawn of creep.room.find(FIND_MY_SPAWNS)) {
                        if (spawn.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                            creep.memory.destination = spawn.id;
                            this.log(creep, "Destination set to Spawn " + spawn.id);
                            break;
                        }
                    }
                }
            }
            else {
                // Are we moving towards the source?
                if (creep.memory.destination == undefined) {
                    creep.memory.destination = creep.memory.target;
                    this.log(creep, "Destination set to my Source");
                }
            }
        }

        if (creep.memory.status == states.MOVING) {
            var destination = Game.getObjectById(creep.memory.destination);
            var moveResponse = "";
            moveResponse = creep.moveTo(destination, {
                reusePath: 32,
                visualizePathStyle: {
                    fill: 'transparent',
                    stroke: '#fff',
                    lineStyle: 'dashed',
                    strokeWidth: .15,
                    opacity: .1
                }
            });
        }

        if (creep.memory.status == states.HARVESTING) {
            creep.harvest(Game.getObjectById(creep.memory.target));
        }

        if (creep.memory.status == states.DUMPING) {
            creep.transfer(Game.getObjectById(creep.memory.destination), RESOURCE_ENERGY);
        }
    },
    log: function(creep, msg, chatter) {
        console.log("[" + creep.name + "]: " + msg);
        if (chatter != undefined) {
            creep.say(chatter);
        }
    }
}