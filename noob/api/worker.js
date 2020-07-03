// Worker API
// Add functions to the Creep API to make our job easier

// Delegate Methods
function creepDelegate(delegateName) {
    return function() {
        let prototype = this.loadPrototype();
        if (prototype[delegateName] != undefined) {
            prototype[delegateName](this)
        }
    }
}

Creep.prototype.init = creepDelegate('init');
Creep.prototype.assess = creepDelegate('assess');
Creep.prototype.run = creepDelegate('run');

// Non-Delegate Methods
// Return the role prototype module for this creep
Creep.prototype.loadPrototype = function() {
    return require('worker.' + this.memory.role);
}

// Logs info in the context of this creep
Creep.prototype.log = function(message, quip) {
    console.log("[" + this.name + "]: " + message);
    if (quip != undefined) {
        this.say(quip);
    }
}