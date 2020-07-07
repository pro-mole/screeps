// Coordinator Module
// Keeps track of the game state and sets tasks for the game structures

var _ = require("lodash")

var WorkerRecipes = require("recipes")

module.exports = {
    init: function() {
        // This object may be re-created from time to time
        // Double-check that the global memory is correct and go on
        if (Memory.coordinator && Memory.coordinator.initialized) {
            if (!this.memory) this.memory = Memory.coordinator;
            return;
        }

        Memory.coordinator = {
            initialized: true,
            level: 1,
            structures: {
            },
            sources: {
            },
            sites: {
            },
            creeps: {
                All: 0
            }
        }
        this.memory = Memory.coordinator;
        
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
    },
    assess: function() {
        var coordinatorLevel = this.memory.level;

        // Create harvesters for the sources
        var knownSources = _.map(this.memory.sources,
            (sourceData, sourceId) => Game.getObjectById(sourceId));
        var vacantSources = _.filter(knownSources,
            (source) => this.memory.sources[source.id].worker == undefined);
        var harvestersNeeded = coordinatorLevel - (knownSources.length - vacantSources.length);
        
        if (harvestersNeeded > 0 && vacantSources.length > 0) {
            for (let spawnId in Game.spawns) {
                let spawn = Game.spawns[spawnId];
                var closestSource = spawn.pos.findClosestByPath(vacantSources);
                if (this.addStructureWorker("harvester", closestSource, spawn)) {
                    _.pull(vacantSources, closestSource);
                    harvestersNeeded -= 1;
                }

                if (harvestersNeeded == 0) break;
            }
        }

        // Create builders for the construction sites
        var knownSites = _.map(this.memory.sites,
            (siteData, siteId) => Game.getObjectById(siteId));
        var vacantSites = _.filter(knownSites,
            (site) => this.memory.sites[site.id].worker == undefined);
        var buildersNeeded = coordinatorLevel - (knownSites.length - vacantSites.length);
        if (buildersNeeded > 0 && vacantSites.length > 0) {
            for (let spawnId in Game.spawns) {
                let spawn = Game.spawns[spawnId];
                var closestSite = spawn.pos.findClosestByPath(vacantSites);
                if (this.addStructureWorker("builder", closestSite, spawn)) {
                    _.pull(vacantSites, closestSite);
                    buildersNeeded -= 1;
                }

                if (buildersNeeded == 0) break;
            }
        }
    },
    addStructure: function(struct) {
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
    addSource: function(source) {
        // Add a source to the memory, if it's not already there
        // Returns true if the structure was actually unknown
        var sourceMemory = this.memory.sources;
        if (!(source.id in sourceMemory)) {
            sourceMemory[source.id] = {};
            return true;
        }

        return false;
    },
    addStructureWorker: function(type, target, spawn) {
        // Creates a worker that will be assigned to a structure or source
        // Returns true if the worker was successfully added
        if (!(type in WorkerRecipes)) {
            return false;
        }

        var recipe = WorkerRecipes[type].recipe;
        var name = type + "_" + (++this.memory.creeps.All);
        if (spawn.spawnCreep(recipe, name, {dryRun: true}) == OK) {
            var newCreep = spawn.spawnCreep(recipe, name, {
                memory: {
                    initialized: false,
                    role: type,
                    target: target.id
                }
            });
            
            if (target.id in this.memory.sources) {
                this.memory.sources[target.id].worker = name;
                console.log("Assigned  creep '" + name + "' to source '" + target.id + "'")
            }
            if (target.id in this.memory.sites) {
                this.memory.sites[target.id].worker = name;
                console.log("Assigned  creep '" + name + "' to construction site '" + target.id + "'")
            }

            return true;
        }

        return false;
    },
    cleanup: function() {
        for (let sourceId in this.memory.sources) {
            let source = this.memory.sources[sourceId];
            let workerId = source.worker;
            if (workerId != undefined) {
                let worker = Game.creeps[workerId];
                if (worker == undefined) {
                    source.worker = undefined;
                }
            }
        }

        for (let structId in this.memory.structures) {
            let structure = this.memory.structures[structId];
            let workerId = structure.worker;
            if (workerId != undefined) {
                let worker = Game.creeps[workerId];
                if (worker == undefined) {
                    structure.worker = undefined;
                }
            }
        }
    }
}