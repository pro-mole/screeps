// Coordinator Module
// Keeps track of the game state and sets tasks for the game structures

var _ = require("lodash")

var WorkerRecipes = require("recipes")

Memory.coordinator = {
    structures = {
    },
    creeps = {
        All = 0
    }
}

module.exports = {
    memory: Memory.coordinator,
    process: {},
    init: function() {
        // Assess all structures in my rooms
        for (roomName in Game.rooms) {
            var room = Game.rooms[roomName];
            for (structId in room.find(FIND_STRUCTURES)) {
                this.addStructure(Game.getObjectById(structId));
            }

            for (sourceId in room.find(FIND_SOURCES)) {
                this.addSource(Game.getObjectById(sourceId));
            }
        }
    },
    assess: function() {
        // Create harvesters for the sources
        for (sourceId in this.memory.sources) {
            if (this.memory.sources[sourceId].worker == undefined) {
                this.addStructureWorker("harvester", Game.getObjectById(sourceId));
            }
        }
    },
    addStructure: function(struct) {
        // Add a structure to the memory, if it's not already there
        // Returns true if the structure was actually unknown
        var structType = struct.structureType;
        if (!structType in this.memory.structures) {
            this.memory.structures[structType] = {};
        }
        
        var structMemory = this.memory.structures[structType];
        if (! struct.id in structMemory) {
            structMemory.push(struct.id);
            return true;
        }

        return false;
    },
    addSource: function(source) {
        // Add a source to the memory, if it's not already there
        // Returns true if the structure was actually unknown
        var sourceMemory = this.memory.sources;
        if (! source.id in sourceMemory) {
            sourceMemory.push(source.id);
            return true;
        }

        return false;
    },
    addStructureWorker: function(type, target) {
        // Creates a worker that will be assigned to a structure or source
        // Returns true if the worker was successfully added
        if (!type in WorkerRecipes) {
            return false;
        }

        var recipe = WorkerRecipes[type].recipe;
        var name = type + "_" + (++this.memory.creeps.All);
        for (spawnId in this.memory.structures[STRUCTURE_SPAWN]) {
            var spawn = Game.getObjectById(spawnId);
            if (spawn.spawnCreep(recipe, name, {dryRun = true}) == OK) {
                var newCreep = spawn.spawnCreep(recipe, name, memory = {
                    role = type,
                    target = target.id
                });
                var workerPrototype = require("worker/" + type);
                workerPrototype.init(newCreep, target.id);
                
                if (target.id in this.memory.sources) {
                    this.memory.sources[target.id].worker = newCreep.id;
                }

                return true;
            }
        }

        return false;
    }
}