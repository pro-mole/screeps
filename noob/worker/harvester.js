// Harvester Worker Behavior

var states = {
    IDLE: "idle",
    MOVING: "moving",
    HARVESTING: "harvesting",
    DUMPING: "dumping"
};

module.export = {
    init: function(creep, target) {
        creep.memory.status = states.IDLE;

        creep.prototype.assess = this.assess;
        creep.prototype.run = this.run;
    },
    assess: function() {
        if (this.memory.status == states.IDLE) {
            if (this.memory.destination != undefined) {
                // Trace the path to the destination
                this.memory.status = states.MOVING;
            }
        }

        if (this.memory.status == states.MOVING) {
            var destination = Game.getObjectById(this.memory.destination);
            if (this.pos.isNearTo(destination.pos)) {
                if (this.memory.destination == this.memory.target) {
                    this.memory.status = states.HARVESTING;
                }
                else {
                    this.memory.status = states.DUMPING;
                }
            }
        }

        if (this.memory.status == states.HARVESTING) {
            if (this.store.getFreeCapacity() == 0) {
                this.memory.destination = null;
                this.memory.status = states.IDLE;
            }
        }

        if (this.memory.status == states.DUMPING) {
            if (this.store.getUsedCapacity() == 0) {
                this.memory.destination = null;
                this.memory.status = states.IDLE;
            }
        }
    },
    run: function() {
        if (this.memory.status == states.IDLE) {
            // Is it full?
            if (this.store.getFreeCapacity() == 0) {
                // Do we have somewhere to dump this?
                if (this.memory.destination == undefined) {
                    // Find a destination to trace a path towards
                    // Priority 1 - Spawns
                    for (let spawn of this.room.find(FIND_MY_SPAWNS)) {
                        if (spawn.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                            this.memory.destination = spawn.id;
                            break;
                        }
                    }
                }
            }
            else {
                // Are we moving towards the source?
                if (this.memory.destination == undefined) {
                    this.memory.destination = this.memory.target;
                }
            }
        }

        if (this.memory.status == states.MOVING) {
            var destination = Game.getObjectById(this.memory.destination);
            var moveResponse = "";
            while (moveResponse != ERR_TIRED && !this.pos.isNearTo(destination.pos)) {
                moveResponse = this.moveTo(destination, {
                    reusePath: 32
                });
            }
        }

        if (this.memory.status == states.HARVESTING) {
            this.harvest(Game.getObjectById(this.memory.target));
        }

        if (this.memory.status == states.DUMPING) {
            this.transger(Game.getObjectById(this.memory.destination), RESOURCE_ENERGY);
        }
    }
}