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
})

export const TileCollisionType = Object.freeze({
    Empty: 0,
    Full: 1,
    SlopesStart: 2,
    SlopeMid1: 3,
    SlopeMid1FX: 4,
    SlopeMid1FY: 5,
    SlopeMid1FXY: 6,
    SlopeMid1F90: 7,
    SlopeMid1F90X: 8,
    SlopeMid1F90Y: 9,
    SlopeMid1F90XY: 10,
    SlopeMid1Rev: 11,
    SlopeMid1RevFX: 12,
    SlopeMid1RevFY: 13,
    SlopeMid1RevFXY: 14,
    SlopeMid1RevF90: 15,
    SlopeMid1RevF90X: 16,
    SlopeMid1RevF90Y: 17,
    SlopeMid1RevF90XY: 18,
    Slope45: 19,
    Slope45FX: 20,
    Slope45FY: 21,
    Slope45FXY: 22,
    Slope45F90: 23,
    Slope45F90X: 24,
    Slope45F90Y: 25,
    Slope45F90XY: 26,
    Slope22P1: 27,
    Slope22P1FX: 28,
    Slope22P1FY: 29,
    Slope22P1FXY: 30,
    Slope22P1F90: 31,
    Slope22P1F90X: 32,
    Slope22P1F90Y: 33,
    Slope22P1F90XY: 34,
    Slope22P2: 35,
    Slope22P2FX: 36,
    Slope22P2FY: 37,
    Slope22P2FXY: 38,
    Slope22P2F90: 39,
    Slope22P2F90X: 40,
    Slope22P2F90Y: 41,
    Slope22P2F90XY: 42,
    SlopeMid2: 43,
    SlopeMid2FX: 44,
    SlopeMid2FY: 45,
    SlopeMid2FXY: 46,
    SlopeMid2F90: 47,
    SlopeMid2F90X: 48,
    SlopeMid2F90Y: 49,
    SlopeMid2F90XY: 50,
    SlopeMid2Rev: 51,
    SlopeMid2RevFX: 52,
    SlopeMid2RevFY: 53,
    SlopeMid2RevFXY: 54,
    SlopeMid2RevF90: 55,
    SlopeMid2RevF90X: 56,
    SlopeMid2RevF90Y: 57,
    SlopeMid2RevF90XY: 58,
    Slope15P1: 59,
    Slope15P1FX: 60,
    Slope15P1FY: 61,
    Slope15P1FXY: 62,
    Slope15P1F90: 63,
    Slope15P1F90X: 64,
    Slope15P1F90Y: 65,
    Slope15P1F90XY: 66,
    Slope15P2: 67,
    Slope15P2FX: 68,
    Slope15P2FY: 69,
    Slope15P2FXY: 70,
    Slope15P2F90: 71,
    Slope15P2F90X: 72,
    Slope15P2F90Y: 73,
    Slope15P2F90XY: 74,
    Slope15P3: 75,
    Slope15P3FX: 76,
    Slope15P3FY: 77,
    Slope15P3FXY: 78,
    Slope15P3F90: 79,
    Slope15P3F90X: 80,
    Slope15P3F90Y: 81,
    Slope15P3F90XY: 82,
    SlopeMid3: 83,
    SlopeMid3FX: 84,
    SlopeMid3FY: 85,
    SlopeMid3FXY: 86,
    SlopeMid3F90: 87,
    SlopeMid3F90X: 88,
    SlopeMid3F90Y: 89,
    SlopeMid3F90XY: 90,
    SlopeMid3Rev: 91,
    SlopeMid3RevFX: 92,
    SlopeMid3RevFY: 93,
    SlopeMid3RevFXY: 94,
    SlopeMid3RevF90: 95,
    SlopeMid3RevF90X: 96,
    SlopeMid3RevF90Y: 97,
    SlopeMid3RevF90XY: 98,
    Slope11P1: 99,
    Slope11P1FX: 100,
    Slope11P1FY: 101,
    Slope11P1FXY: 102,
    Slope11P1F90: 103,
    Slope11P1F90X: 104,
    Slope11P1F90Y: 105,
    Slope11P1F90XY: 106,
    Slope11P2: 107,
    Slope11P2FX: 108,
    Slope11P2FY: 109,
    Slope11P2FXY: 110,
    Slope11P2F90: 111,
    Slope11P2F90X: 112,
    Slope11P2F90Y: 113,
    Slope11P2F90XY: 114,
    Slope11P3: 115,
    Slope11P3FX: 116,
    Slope11P3FY: 117,
    Slope11P3FXY: 118,
    Slope11P3F90: 119,
    Slope11P3F90X: 120,
    Slope11P3F90Y: 121,
    Slope11P3F90XY: 122,
    Slope11P4: 123,
    Slope11P4FX: 124,
    Slope11P4FY: 125,
    Slope11P4FXY: 126,
    Slope11P4F90: 127,
    Slope11P4F90X: 128,
    Slope11P4F90Y: 129,
    Slope11P4F90XY: 130,
    SlopeMid4: 131,
    SlopeMid4FX: 132,
    SlopeMid4FY: 133,
    SlopeMid4FXY: 134,
    SlopeMid4F90: 135,
    SlopeMid4F90X: 136,
    SlopeMid4F90Y: 137,
    SlopeMid4F90XY: 138,
    SlopeMid4Rev: 139,
    SlopeMid4RevFX: 140,
    SlopeMid4RevFY: 141,
    SlopeMid4RevFXY: 142,
    SlopeMid4RevF90: 143,
    SlopeMid4RevF90X: 144,
    SlopeMid4RevF90Y: 145,
    SlopeMid4RevF90XY: 146,

    OneWayStart: 147,
    OneWaySlopeMid1: 147,
    OneWaySlopeMid1FX: 148,
    OneWaySlopeMid1FY: 149,
    OneWaySlopeMid1FXY: 150,
    OneWaySlopeMid1F90: 151,
    OneWaySlopeMid1F90X: 152,
    OneWaySlopeMid1F90Y: 153,
    OneWaySlopeMid1F90XY: 154,
    OneWaySlopeMid1Rev: 155,
    OneWaySlopeMid1RevFX: 156,
    OneWaySlopeMid1RevFY: 157,
    OneWaySlopeMid1RevFXY: 158,
    OneWaySlopeMid1RevF90: 159,
    OneWaySlopeMid1RevF90X: 160,
    OneWaySlopeMid1RevF90Y: 161,
    OneWaySlopeMid1RevF90XY: 162,
    OneWaySlope45: 163,
    OneWaySlope45FX: 164,
    OneWaySlope45FY: 165,
    OneWaySlope45FXY: 166,
    OneWaySlope45F90: 167,
    OneWaySlope45F90X: 168,
    OneWaySlope45F90Y: 169,
    OneWaySlope45F90XY: 170,
    OneWaySlope22P1: 171,
    OneWaySlope22P1FX: 172,
    OneWaySlope22P1FY: 173,
    OneWaySlope22P1FXY: 174,
    OneWaySlope22P1F90: 175,
    OneWaySlope22P1F90X: 176,
    OneWaySlope22P1F90Y: 177,
    OneWaySlope22P1F90XY: 178,
    OneWaySlope22P2: 179,
    OneWaySlope22P2FX: 180,
    OneWaySlope22P2FY: 181,
    OneWaySlope22P2FXY: 182,
    OneWaySlope22P2F90: 183,
    OneWaySlope22P2F90X: 184,
    OneWaySlope22P2F90Y: 185,
    OneWaySlope22P2F90XY: 186,
    OneWaySlopeMid2: 187,
    OneWaySlopeMid2FX: 188,
    OneWaySlopeMid2FY: 189,
    OneWaySlopeMid2FXY: 190,
    OneWaySlopeMid2F90: 191,
    OneWaySlopeMid2F90X: 192,
    OneWaySlopeMid2F90Y: 193,
    OneWaySlopeMid2F90XY: 194,
    OneWaySlopeMid2Rev: 195,
    OneWaySlopeMid2RevFX: 196,
    OneWaySlopeMid2RevFY: 197,
    OneWaySlopeMid2RevFXY: 198,
    OneWaySlopeMid2RevF90: 199,
    OneWaySlopeMid2RevF90X: 200,
    OneWaySlopeMid2RevF90Y: 201,
    OneWaySlopeMid2RevF90XY: 202,
    OneWaySlope15P1: 203,
    OneWaySlope15P1FX: 204,
    OneWaySlope15P1FY: 205,
    OneWaySlope15P1FXY: 206,
    OneWaySlope15P1F90: 207,
    OneWaySlope15P1F90X: 208,
    OneWaySlope15P1F90Y: 209,
    OneWaySlope15P1F90XY: 210,
    OneWaySlope15P2: 211,
    OneWaySlope15P2FX: 212,
    OneWaySlope15P2FY: 213,
    OneWaySlope15P2FXY: 214,
    OneWaySlope15P2F90: 215,
    OneWaySlope15P2F90X: 216,
    OneWaySlope15P2F90Y: 217,
    OneWaySlope15P2F90XY: 218,
    OneWaySlope15P3: 219,
    OneWaySlope15P3FX: 220,
    OneWaySlope15P3FY: 221,
    OneWaySlope15P3FXY: 222,
    OneWaySlope15P3F90: 223,
    OneWaySlope15P3F90X: 224,
    OneWaySlope15P3F90Y: 225,
    OneWaySlope15P3F90XY: 226,
    OneWaySlopeMid3: 227,
    OneWaySlopeMid3FX: 228,
    OneWaySlopeMid3FY: 229,
    OneWaySlopeMid3FXY: 230,
    OneWaySlopeMid3F90: 231,
    OneWaySlopeMid3F90X: 232,
    OneWaySlopeMid3F90Y: 233,
    OneWaySlopeMid3F90XY: 234,
    OneWaySlopeMid3Rev: 235,
    OneWaySlopeMid3RevFX: 236,
    OneWaySlopeMid3RevFY: 237,
    OneWaySlopeMid3RevFXY: 238,
    OneWaySlopeMid3RevF90: 239,
    OneWaySlopeMid3RevF90X: 240,
    OneWaySlopeMid3RevF90Y: 241,
    OneWaySlopeMid3RevF90XY: 242,
    OneWaySlope11P1: 243,
    OneWaySlope11P1FX: 244,
    OneWaySlope11P1FY: 245,
    OneWaySlope11P1FXY: 246,
    OneWaySlope11P1F90: 247,
    OneWaySlope11P1F90X: 248,
    OneWaySlope11P1F90Y: 249,
    OneWaySlope11P1F90XY: 250,
    OneWaySlope11P2: 251,
    OneWaySlope11P2FX: 252,
    OneWaySlope11P2FY: 253,
    OneWaySlope11P2FXY: 254,
    OneWaySlope11P2F90: 255,
    OneWaySlope11P2F90X: 256,
    OneWaySlope11P2F90Y: 257,
    OneWaySlope11P2F90XY: 258,
    OneWaySlope11P3: 259,
    OneWaySlope11P3FX: 260,
    OneWaySlope11P3FY: 261,
    OneWaySlope11P3FXY: 262,
    OneWaySlope11P3F90: 263,
    OneWaySlope11P3F90X: 264,
    OneWaySlope11P3F90Y: 265,
    OneWaySlope11P3F90XY: 266,
    OneWaySlope11P4: 267,
    OneWaySlope11P4FX: 268,
    OneWaySlope11P4FY: 269,
    OneWaySlope11P4FXY: 270,
    OneWaySlope11P4F90: 271,
    OneWaySlope11P4F90X: 272,
    OneWaySlope11P4F90Y: 273,
    OneWaySlope11P4F90XY: 274,
    OneWaySlopeMid4: 275,
    OneWaySlopeMid4FX: 276,
    OneWaySlopeMid4FY: 277,
    OneWaySlopeMid4FXY: 278,
    OneWaySlopeMid4F90: 279,
    OneWaySlopeMid4F90X: 280,
    OneWaySlopeMid4F90Y: 281,
    OneWaySlopeMid4F90XY: 282,
    OneWaySlopeMid4Rev: 283,
    OneWaySlopeMid4RevFX: 284,
    OneWaySlopeMid4RevFY: 285,
    OneWaySlopeMid4RevFXY: 286,
    OneWaySlopeMid4RevF90: 287,
    OneWaySlopeMid4RevF90X: 288,
    OneWaySlopeMid4RevF90Y: 289,
    OneWaySlopeMid4RevF90XY: 290,
    SlopesEnd: 290,
    OneWayFull: 291,
    OneWayEnd: 292,
    Count: 293
})