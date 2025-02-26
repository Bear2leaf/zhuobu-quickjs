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
export const ObjectType = Object.freeze({
    Player: 0,
    NPC: 1,
})


export const TileType = Object.freeze({
    Empty: 0,
    Block: 1,
    OneWay: 2,
    TestSlopeMid1: 3,
    TestSlopeMid1FX: 4,
    TestSlopeMid1FY: 5,
    TestSlopeMid1FXY: 6,
    TestSlopeMid1F90: 7,
    TestSlopeMid1F90X: 8,
    TestSlopeMid1F90Y: 9,
    TestSlopeMid1F90XY: 10,
    TestSlope45: 11,
    TestSlope45FX: 12,
    TestSlope45FY: 13,
    TestSlope45FXY: 14,
    TestSlope45F90: 15,
    TestSlope45F90X: 16,
    TestSlope45F90Y: 17,
    TestSlope45F90XY: 18,
    Full: 19,
})

export const TileCollisionType = Object.freeze({
    Empty: 0,
    Block: 1,
    OneWay: 2,
    SlopeMid1: 3,
    SlopeMid1FX: 4,
    SlopeMid1FY: 5,
    SlopeMid1FXY: 6,
    SlopeMid1F90: 7,
    SlopeMid1F90X: 8,
    SlopeMid1F90Y: 9,
    SlopeMid1F90XY: 10,
    Slope45: 11,
    Slope45FX: 12,
    Slope45FY: 13,
    Slope45FXY: 14,
    Slope45F90: 15,
    Slope45F90X: 16,
    Slope45F90Y: 17,
    Slope45F90XY: 18,
    Full: 19,
})