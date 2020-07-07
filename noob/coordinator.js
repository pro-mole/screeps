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

        // Reassess construction sites
        for (let roomName in Game.rooms) {
            var room = Game.rooms[roomName];
            for (let site of room.find(FIND_CONSTRUCTION_SITES)) {
                this.addSite(site);
            }
        }

        // Check if we need more harvesters
        var knownSources = _.map(this.memory.sources,
            (sourceData, sourceId) => Game.getObjectById(sourceId));
        this.vacantSources = _.filter(knownSources,
            (source) => this.memory.sources[source.id].worker == undefined);
        this.harvestersNeeded = coordinatorLevel - (knownSources.length - this.vacantSources.length);

        // Check if we need more builders
        var knownSites = _.map(this.memory.sites,
            (siteData, siteId) => Game.getObjectById(siteId));
        this.vacantSites = _.filter(knownSites,
            (site) => this.memory.sites[site.id].worker == undefined);
        this.buildersNeeded = coordinatorLevel - (knownSites.length - this.vacantSites.length);
        

    },
    coordinate: function() {
        // Create harvesters for the sources
        if (this.harvestersNeeded > 0 && this.vacantSources.length > 0) {
            for (let spawnId in Game.spawns) {
                let spawn = Game.spawns[spawnId];
                var closestSource = spawn.pos.findClosestByPath(this.vacantSources);
                if (this.addStructureWorker("harvester", closestSource, spawn)) {
                    _.pull(this.vacantSources, closestSource);
                    this.harvestersNeeded -= 1;
                }

                if (this.harvestersNeeded == 0) break;
            }
        }

        // Create builders for the construction sites
        if (this.buildersNeeded > 0 && this.vacantSites.length > 0) {
            for (let spawnId in Game.spawns) {
                let spawn = Game.spawns[spawnId];
                var closestSite = spawn.pos.findClosestByPath(this.vacantSites);
                if (this.addStructureWorker("builder", closestSite, spawn)) {
                    _.pull(this.vacantSites, closestSite);
                    this.buildersNeeded -= 1;
                }

                if (this.buildersNeeded == 0) break;
            }
        }

        // If the Spawn is full, start building containers
        for (let spawnId in Game.spawns) {
            let spawn = Game.spawns[spawnId];
            if (spawn.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
                var knownSources = _.map(this.memory.sources,
                    (sourceData, sourceId) => Game.getObjectById(sourceId));
                var vacantSources = _.filter(knownSources,
                    (source) => this.memory.sources[source.id].storage == undefined);
                var closestSource = spawn.pos.findClosestByPath(vacantSources);

                if (closestSource != undefined) {
                    let pathToSource = spawn.pos.findPathTo(closestSource);
                    let midPoint = pathToSource[pathToSource.length / 2];
                    if (spawn.room.createConstructionSite(midPoint.x, midPoint.y, STRUCTURE_CONTAINER) == OK) {
                        // Can't use the id of the newly generated site, so for now just leave a marker for it
                        this.memory.sources[closestSource.id].storage = {x: midPoint.x, y: midPoint.y};
                    }
                }
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
        if (source.id in sourceMemory) 
            return false;

        sourceMemory[source.id] = {};

        return true;
    },
    addSite: function(site) {
        // Add a construction site to the memory, if it's not already there
        // Returns true if the structure was actually unknown
        var siteMemory = this.memory.sites;
        if (site.id in siteMemory) 
            return false;

        siteMemory[site.id] = {
            x: site.pos.x,
            y: site.pos.y
        };

        return true;
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