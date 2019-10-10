module.exports = {
    init: function(data) {
        // If no source defined, find a source
        // State => To Source
    },
    state_check: function() {
        // If adjacent to the source and not Harvesting => Harvesting
        // If harvesting and full => To Destination
        // If adjacent to destination and not empty => Dumping
        // If dumping and empty => DONE
    },
    run: function() {
        // To Source: move towards source
        // Harvesting: gather energy
        // To Destination: move towards destination
        // Dumping: transfer energy to destination
    }
}
