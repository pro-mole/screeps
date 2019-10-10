# Screeps AI Architecture (i.e. Planning How to Plan)

Starting simple, this Screeps AI is composed of these components:

# Central AI

A central AI that runs as a singleton entity, coodrinating actions and keeping information. Each loop cycle, the AI:

* *Coordinates, taking actions (e.g. spawning screeps) and setting tasks to units;
* *Delegate*, sending the order for each unit to take action (see below);
* *Assess*, updating its own data to feed into the next round of decisions;

# Tasks

Each unit (screep) is given a *task* attribute, which contains an object with data and reference to a set of rules. The main pieces of data the task contains are:

* a reference to its rulebook (i.e. a *prototype*);
* a *state*

The operations contained in the rulebook of each task definition include:

* *state_check*, checking the current state and data and transitioning to the next state if necessary;
* *run*, peforming actions depending on the current state;

At the end of a loop, any task with a null *state* is cleared, leaving is screep idle.

# Worker Type

A file describes a list of worker types, which are a list of parts associated with a name. The main AI may spawn workers of a given type, keeping track of which screeps are in each type (keeping up a reference table, putting simply).