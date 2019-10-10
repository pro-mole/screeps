// Coordinator AI


module.exports = {
    workers: {}, // Worker list by type
    sources: {}, // Sources of energy
    center: {}, // Control centers

    /// Take actions given the current conditions
    coordinate: function() {
        // DRAFT - If there are no workers, spawn a worker and set it to harvest
    },
    /// Assign tasks to idle workers
    delegate: function() {
        // DRAFT - If a worker is idle, set it to harvest
    },
    /// Assess the state of the world, updating internal data
    assess: function() {
    },

    /// Spawn a worker of the given worker type
    spawn: function(workerType) {

    },
    /// Assign a task to a worker, with given data (if relevant)
    giveTask: function(worker, rulebook, taskData) {

    }
}
