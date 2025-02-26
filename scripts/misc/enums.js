export const CharacterState = Object.freeze({
    Stand: 0,
    Walk: 1,
    Jump: 2,
    GrabLedge: 3,
});
export const KeyInput = Object.freeze({
    GoLeft: 0,
    GoRight: 1,
    GoDown: 2,
    Jump: 3,
    ScaleDown: 4,
    ScaleUp: 5
});
export const KeyCode = Object.freeze({

    RightKey: 39,
    LeftKey: 37,
    DownKey: 40,
    JumpKey: 32,
    Minus: 189,
    Equal: 187
})

export const KeyCodeGLFW = Object.freeze({
    RightKey: 262,
    LeftKey: 263,
    DownKey: 264,
    JumpKey: 32,
    Minus: 45,
    Equal: 61
})
export const TileType = Object.freeze({
    Empty: 0,
    Block: 1,
    OneWay: 2
})