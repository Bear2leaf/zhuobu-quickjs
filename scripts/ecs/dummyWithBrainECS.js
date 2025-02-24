import {
    getTime, createWorld,
    query,
    addEntity,
    addComponent,
} from '../libs.js'

/**
 * @typedef EcsComponents
 * @property {Object} Position
 * @property {Array<number>} Position.x
 * @property {Array<number>} Position.y
 * @property {Object} Velocity
 * @property {Array<number>} Velocity.x
 * @property {Array<number>} Velocity.y
 * @property {Array<number>} Health
 * @property {Object} Thought
 * @property {Array<string>} Thought.foo
 */

/**
 * @typedef EcsWorld 
 * @property {EcsComponents} components
 * @property {Object} time
 * @property {number} time.delta
 * @property {number} time.elapsed
 * @property {number} time.then
 */
/**
 * @type {EcsWorld}
 */
const world = createWorld({
    components: {
        Position: { x: [], y: [] },
        Velocity: { x: [], y: [] },
        Health: [],
        Thought: { foo: [] }
    },
    time: {
        delta: 0,
        elapsed: 0,
        then: 0
    }
})

const { Position, Velocity, Health } = world.components

const eid = addEntity(world)
addComponent(world, eid, Position)
addComponent(world, eid, Velocity)
Position.x[eid] = 0
Position.y[eid] = 0
Velocity.x[eid] = 1.23
Velocity.y[eid] = 1.23
Health[eid] = 100
/**
 * 
 * @param {EcsWorld} world 
 */
const movementSystem = (world) => {
    const { Position, Velocity, Thought } = world.components;
    const { time } = world
    for (const eid of query(world, [Position, Velocity])) {
        Position.x[eid] += Velocity.x[eid] * time.delta
        Position.y[eid] += Velocity.y[eid] * time.delta
        Thought.foo[eid] = `I am at ${Position.x[eid]}, ${Position.y[eid]}`
    }

}

/**
 * 
 * @param {EcsWorld} world 
 */
const timeSystem = (world) => {
    const { time } = world
    const now = getTime()
    const delta = now - time.then
    time.delta = delta
    time.elapsed += delta
    time.then = now
}

/**
 * 
 * @param {EcsWorld} world 
 */
export const loggerSystem = (world) => {
    const { Position, Velocity, Health, Thought } = world.components
    for (const eid of query(world, [Position])) {
        console.log(`Entity [${eid}] thinks ${Thought.foo[eid]}`)
    }
}
export const dummyWithBrainECS = () => {
    movementSystem(world)
    timeSystem(world)
    loggerSystem(world)
}
