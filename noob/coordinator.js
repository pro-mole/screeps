// Coordinator Module
// Keeps track of the game state and sets tasks for the game structures

var _ = require("lodash")

var WorkerRecipes = require("recipes")

Memory.coordinator = {
    level: 1,
    initialized: false,
    resources: {
        RESOURCE_ENERGY: 0
    },
    structures: {
    },
    sources: {
    },
    creeps: {
        All: 0
    }
}

module.exports = {
    memory: Memory.coordinator,
    process: {},
    init: function () {
        this.level = 1;

        // Assess all structures in my rooms
        for (let roomName in Game.rooms) {
            var room = Game.rooms[roomName];
            for (let struct of room.find(FIND_STRUCTURES)) {
                this.addStructure(struct);
            }

            for (let source of room.find(FIND_SOURCES)) {
                this.addSource(source);
            }
        }

        this.memory.initialized = true;
    },
    assess: function () {
        // Re-count resources


        // Create harvesters for the sources
        for (let sourceId in this.memory.sources) {
            if (this.memory.sources[sourceId].worker == undefined) {
                this.addStructureWorker("harvester", Game.getObjectById(sourceId));
            }
        }
    },
    addStructure: function (struct) {
        // Add a structure to the memory, if it's not already there
        // Returns true if the structure was actually unknown
        var structType = struct.structureType;

        if (!(structType in this.memory.structures)) {
            this.memory.structures[structType] = {};
        }

        var structMemory = this.memory.structures[structType];
        if (!(struct.id in structMemory)) {
            structMemory[struct.id] = {};
            return true;
        }

        return false;
    },
    addSource: function (source) {
        // Add a source to the memory, if it's not already there
        // Returns true if the structure was actually unknown
        var sourceMemory = this.memory.sources;
        if (!(source.id in sourceMemory)) {
            sourceMemory[source.id] = {};
            return true;
        }

        return false;
    },
    addStructureWorker: function (type, target) {
        // Creates a worker that will be assigned to a structure or source
        // Returns true if the worker was successfully added
        if (!(type in WorkerRecipes)) {
            return false;
        }

        var recipe = WorkerRecipes[type].recipe;
        var name = type + "_" + (++this.memory.creeps.All);
        for (let spawnId in this.memory.structures[STRUCTURE_SPAWN]) {
            var spawn = Game.getObjectById(spawnId);
            var spawnMem = this.memory.structures[STRUCTURE_SPAWN][spawnId];
            if (!spawnMem.spawning && spawn.spawnCreep(recipe, name, { dryRun: true }) == OK) {
                spawnMem.spawning = true; //TODO clean this up later
                var newCreep = spawn.spawnCreep(recipe, name, {
                    memory: {
                        initialized: false,
                        role: type,
                        target: target.id
                    }
                });

                if (target.id in this.memory.sources) {
                    this.memory.sources[target.id].worker = name;
                    console.log("Assigned  creep '" + name + "' to structure '" + target.id + "'")
                }

                return true;
            }
        }

        return false;
    },
    cleanup: function () {
        // Clean up the worker field for all structures if the creep is dead
        for (let sourceMem of this.memory.sources) {
            if (sourceMem.worker != undefined) {
                let worker = Game.creeps[sourceMem.worker];
                if (worker == undefined) {
                    sourceMem.worker = undefined;
                }
            }
        }

        for (let structMem of this.memory.structures) {
            if (structMem.worker != undefined) {
                let worker = Game.creeps[structMem.worker];
                if (worker == undefined) {
                    structMem.worker = undefined;
                }
            }
        }
    }
}