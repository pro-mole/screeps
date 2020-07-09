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
            (source) => {
                let sourceData = this.memory.sources[source.id];
                return sourceData.workers.length < sourceData.capacity;
            });
        let availableHarvesters = _.reduce(this.vacantSources, (workers, source) => workers + this.memory.sources[source.id].workers.length, 0)
        this.harvestersNeeded = 2 * coordinatorLevel - availableHarvesters; 

        // Check if we need more builders
        var knownSites = _.map(this.memory.sites,
            (siteData, siteId) => Game.getObjectById(siteId));
        this.vacantSites = _.filter(knownSites,
            (site) => this.memory.sites[site.id].worker == undefined);
        let availableBuilders = knownSites.length - this.vacantSites.length;
        this.buildersNeeded = coordinatorLevel - availableBuilders;
        
        // Check if we need more upgraders
        var knownControllers = _.map(this.memory.structures[STRUCTURE_CONTROLLER],
            (_, controllerId) => Game.getObjectById(controllerId));
        this.vacantControllers = _.filter(knownControllers,
            (controller) => this.memory.structures[STRUCTURE_CONTROLLER][controller.id].worker == undefined);
        let availableUpgraders = knownControllers.length - this.vacantControllers.length;
        this.upgradersNeeded = coordinatorLevel - availableUpgraders;
    },
    coordinate: function() {
        let busySpawns = {}
        // Create harvesters for the sources
        if (this.harvestersNeeded > 0 && this.vacantSources.length > 0) {
            for (let spawnId in Game.spawns) {
                if (busySpawns[spawnId] != undefined) continue;

                let spawn = Game.spawns[spawnId];
                var closestSource = spawn.pos.findClosestByPath(this.vacantSources);
                if (this.addStructureWorker("harvester", closestSource, spawn)) {
                    busySpawns[spawnId] = true;
                    let sourceData = this.memory.sources[closestSource.id];
                    if (sourceData.workers.length >= sourceData.capacity)
                        _.pull(this.vacantSources, closestSource);
                    this.harvestersNeeded -= 1;
                }

                if (this.harvestersNeeded <= 0) break;
            }
        }

        // Create builders for the construction sites
        if (this.buildersNeeded > 0 && this.vacantSites.length > 0) {
            for (let spawnId in Game.spawns) {
                if (busySpawns[spawnId] != undefined) continue;

                let spawn = Game.spawns[spawnId];
                var closestSite = spawn.pos.findClosestByPath(this.vacantSites);
                if (this.addStructureWorker("builder", closestSite, spawn)) {
                    busySpawns[spawnId] = true;
                    _.pull(this.vacantSites, closestSite);
                    this.buildersNeeded -= 1;
                }

                if (this.buildersNeeded <= 0) break;
            }
        }

        // Create upgraders for the room controller
        if (this.upgradersNeeded > 0 && this.vacantControllers.length > 0) {
            for (let spawnId in Game.spawns) {
                if (busySpawns[spawnId] != undefined) continue;

                let spawn = Game.spawns[spawnId];
                var closestController = spawn.pos.findClosestByPath(this.vacantControllers);
                if (this.addStructureWorker("upgrader", closestController, spawn)) {
                    busySpawns[spawnId] = true;
                    _.pull(this.vacantControllers, closestController);
                    this.upgradersNeeded -= 1;
                }

                if (this.upgradersNeeded <= 0) break;
            }
        }

        // If the Spawn is full, start building containers
        for (let spawnId in Game.spawns) {
            if (busySpawns[spawnId] != undefined) continue;

            let spawn = Game.spawns[spawnId];
            if (spawn.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
                var knownSources = _.map(this.memory.sources,
                    (sourceData, sourceId) => Game.getObjectById(sourceId));
                var unservicedSources = _.filter(knownSources,
                    (source) => this.memory.sources[source.id].storage == undefined);
                var closestSource = spawn.pos.findClosestByPath(unservicedSources);

                if (closestSource != undefined) {
                    let pathToSource = spawn.pos.findPathTo(closestSource);
                    let midPoint = pathToSource[Math.floor(pathToSource.length / 2)];
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

        sourceMemory[source.id] = {
            capacity: 0,
            workers: []
        };

        let terrainData = new Room.Terrain(source.room.name);
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dy == 0 && dx == 0) continue;
                if (terrainData.get(source.pos.x + dx, source.pos.y + dy) == 0) {
                    sourceMemory[source.id].capacity += 1;
                }
            }
        }

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
        if (spawn.spawnCreep(recipe, "DUMMY", {dryRun: true}) == OK) {
            var name = type + "_" + (++this.memory.creeps.All);
            var newCreep = spawn.spawnCreep(recipe, name, {
                memory: {
                    initialized: false,
                    role: type,
                    target: target.id
                }
            });
            
            if (target.structureType != undefined) {
                let memoryBank = this.memory.structures[target.structureType];
                if (target.id in memoryBank) {
                    memoryBank[target.id].worker = name;
                    console.log("Assigned  creep '" + name + "' to structure '" + target.id + "' (" + target.structureType + ")")
                }
            }
            else {
                if (target.id in this.memory.sources) {
                    this.memory.sources[target.id].workers.push(name);
                    console.log("Assigned  creep '" + name + "' to source '" + target.id + "'")
                }
                if (target.id in this.memory.sites) {
                    this.memory.sites[target.id].worker = name;
                    console.log("Assigned  creep '" + name + "' to construction site '" + target.id + "'")
                }
            }

            return true;
        }

        return false;
    },
    levelup: function() {
        let incompleteSpawns = _.filter(Game.spawns,
            (spawn) => spawn.store.getFreeCapacity() > 0);

        if (this.incompleteSpawns.length == 0
            && this.harvestersNeeded <= 0
            && this.buildersNeeded <= 0
            && this.memory.sites.length == 0) {
            this.memory.level++;
        }
    },
    cleanup: function() {
        for (let sourceId in this.memory.sources) {
            let source = this.memory.sources[sourceId];
            _.remove(source.workers,
                (workerId) => Game.creeps[workerId] == undefined
            )
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