class StateMachine {
    constructor(initialState, possibleStates, stateArgs = []) {
        this.initialState = initialState
        this.possibleStates = possibleStates
        this.stateArgs = stateArgs
        this.state = null

        for (const state of Object.values(this.possibleStates)) {
            state.stateMachine = this
        }
    }

    step() {
        if (this.state === null) {
            this.state = this.initialState
            this.possibleStates[this.state].enter(...this.stateArgs)
        }

        this.possibleStates[this.state].execute(...this.stateArgs)
    }

    transition(newState, ...enterArgs) {
        if (this.state !== null) {
            const current = this.possibleStates[this.state]
            if (current && typeof current.exit === 'function') {
                current.exit(...this.stateArgs)
            }
        }

        this.state = newState
        this.possibleStates[this.state].enter(...this.stateArgs, ...enterArgs)
    }
}

class State {
    enter() {}
    execute() {}
    exit() {} 
}