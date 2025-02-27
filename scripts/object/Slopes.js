import { cTileSize } from "../misc/constants.js";
import { TileCollisionType } from "../misc/enums.js";
import { clamp } from "../misc/math.js";
import { SlopeOffsetI } from "./SlopeOffsetI.js";
import { SlopeOffsetSB } from "./SlopeOffsetSB.js";

export const Slopes = {
    empty: new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
    full: new Uint8Array([16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16]),
    slope45: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]),
    slopeMid1: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 8, 7, 6, 5, 4, 3, 2, 1]),
    /** @type {Array<Uint8Array>} */
    slopesHeights: [],
    /** @type {boolean[][]} */
    slopesExtended: [],
    /** @type {SlopeOffsetSB[][][][][]} */
    slopeOffsets: [],
    /**
     * @param {Uint8Array} slope
     * @returns {boolean[]}
     */
    extend(slope) {
        /** @type {boolean[]} */
        const extended = [];
        for (let x = 0; x < slope.length; ++x) {
            for (let y = 0; y < slope.length; ++y) {
                extended[x * slope.length + y] = (y < slope[x]) ? true : false;
            }
        }
        return extended;
    },
    init() {
        this.slopesHeights = [];
        this.slopesExtended = [];
        this.slopeOffsets = [];
        for (let i = 0; i < TileCollisionType.Count; ++i) {
            switch (i) {
                case TileCollisionType.Empty:
                    this.slopesHeights[i] = this.empty;
                    this.slopesExtended[i] = this.extend(this.slopesHeights[i]);
                    this.slopeOffsets[i] = this.cacheSlopeOffsets(this.slopesExtended[i]);
                    break;
                case TileCollisionType.Full:
                    this.slopesHeights[i] = this.full;
                    this.slopesExtended[i] = this.extend(this.slopesHeights[i]);
                    this.slopeOffsets[i] = this.cacheSlopeOffsets(this.slopesExtended[i]);
                    break;
                case TileCollisionType.OneWayFull:
                    this.slopesHeights[i] = this.slopesHeights[TileCollisionType.Full];
                    this.slopesExtended[i] = this.slopesExtended[TileCollisionType.Full];
                    this.slopeOffsets[i] = this.slopeOffsets[TileCollisionType.Full];
                    break;
                case TileCollisionType.Slope45:
                    this.slopesHeights[i] = this.slope45;
                    this.slopesExtended[i] = this.extend(this.slopesHeights[i]);
                    this.slopeOffsets[i] = this.cacheSlopeOffsets(this.slopesExtended[i]);
                    break;
                case TileCollisionType.Slope45FX:
                case TileCollisionType.Slope45FY:
                case TileCollisionType.Slope45FXY:
                case TileCollisionType.Slope45F90:
                case TileCollisionType.Slope45F90X:
                case TileCollisionType.Slope45F90XY:
                case TileCollisionType.Slope45F90Y:
                case TileCollisionType.OneWaySlope45:
                case TileCollisionType.OneWaySlope45FX:
                case TileCollisionType.OneWaySlope45FY:
                case TileCollisionType.OneWaySlope45FXY:
                case TileCollisionType.OneWaySlope45F90:
                case TileCollisionType.OneWaySlope45F90X:
                case TileCollisionType.OneWaySlope45F90XY:
                case TileCollisionType.OneWaySlope45F90Y:
                    this.slopesHeights[i] = this.slopesHeights[TileCollisionType.Slope45];
                    this.slopesExtended[i] = this.slopesExtended[TileCollisionType.Slope45];
                    this.slopeOffsets[i] = this.slopeOffsets[TileCollisionType.Slope45];

                    break;
            }
        }
    },
    /**
     * 
     * @param {boolean[]} slopeExtended 
     * @param {number} posX 
     * @param {number} posY 
     * @param {number} w 
     * @param {number} h 
     * @returns {boolean}
     */
    collides(slopeExtended, posX, posY, w, h) {
        const len = Math.sqrt(slopeExtended.length);
        for (let x = posX; x <= posX + w && x < len; ++x) {
            for (let y = posY; y <= posY + h && y < len; ++y) {
                if (slopeExtended[x * len + y]) {
                    return true;
                }
            }
        }
        return false;
    },
    /**
     * 
     * @param {boolean[]} slopeExtended 
     * @param {number} posX 
     * @param {number} posY 
     * @param {number} w 
     * @param {number} h 
     * @returns {SlopeOffsetSB}
     */
    getOffset5p(slopeExtended, posX, posY, w, h) {
        const len = Math.sqrt(slopeExtended.length);
        let freeUp = 0, freeDown = 0, collidingTop = 0, collidingBottom = 0;
        let freeLeft = 0, freeRight = 0, collidingLeft = 0, collidingRight = 0;

        let movH = h;
        while (movH >= 0 && posY + freeUp < len && this.collides(slopeExtended, posX, (posY + freeUp), w, movH)) {
            if (posY + freeUp == len)
                --movH;
            else
                ++freeUp;
        }

        freeUp += (h - movH);

        movH = h;
        while (movH >= 0 && posY + freeDown >= 0 && this.collides(slopeExtended, posX, (posY + freeDown), w, movH)) {
            if (posY + freeDown == 0)
                --movH;
            else
                --freeDown;
        }

        freeDown -= (h - movH);

        if (freeUp == 0) {
            movH = h;
            while (movH >= 0 && posY + collidingTop < len && !this.collides(slopeExtended, posX, (posY + collidingTop), w, movH)) {
                if (posY + collidingTop == len)
                    --movH;
                else
                    ++collidingTop;
            }

            collidingTop += (h - movH);
            collidingTop -= 1;
        }
        else
            collidingBottom = freeUp;

        if (freeDown == 0) {
            movH = h;
            while (movH >= 0 && posY + collidingBottom >= 0 && !this.collides(slopeExtended, posX, (posY + collidingBottom), w, movH)) {
                if (posY + collidingBottom == 0)
                    --movH;
                else
                    --collidingBottom;
            }

            collidingBottom -= (h - movH);
            collidingBottom += 1;
        }
        else
            collidingTop = freeDown;

        //width

        let movW = w;
        while (movW >= 0 && posY + freeRight < len && this.collides(slopeExtended, (posX + freeRight), posY, movW, h)) {
            if (posX + freeRight == len)
                --movW;
            else
                ++freeRight;
        }

        freeRight += (w - movW);

        movW = w;
        while (movW >= 0 && posX + freeLeft >= 0 && this.collides(slopeExtended, (posX + freeLeft), posY, movW, h)) {
            if (posX + freeLeft == 0)
                --movW;
            else
                --freeLeft;
        }

        freeLeft -= (w - movW);

        if (freeRight == 0) {
            movW = w;
            while (movW >= 0 && posX + collidingRight < len && !this.collides(slopeExtended, (posX + collidingRight), posY, movW, h)) {
                if (posX + collidingRight == len)
                    --movW;
                else
                    ++collidingRight;
            }

            collidingRight += (w - movW);
            collidingRight -= 1;
        }
        else
            collidingLeft = freeRight;

        if (freeLeft == 0) {
            movW = w;
            while (movW >= 0 && posX + collidingLeft >= 0 && !this.collides(slopeExtended, (posX + collidingLeft), posY, movW, w)) {
                if (posX + collidingLeft == 0)
                    --movW;
                else
                    --collidingLeft;
            }

            collidingLeft -= (w - movW);
            collidingLeft += 1;
        }
        else
            collidingRight = freeLeft;

        return new SlopeOffsetSB(freeLeft, freeRight, freeDown, freeUp, collidingLeft, collidingRight, collidingBottom, collidingTop);

    },
    /** 
     * @param {vec2} tileCenter
     * @param {number} leftX
     * @param {number} rightX
     * @param {number} bottomY
     * @param {number} topY
     * @param {EnumValue<TileCollisionType>} tileCollisionType
     * @returns {SlopeOffsetSB}
    */
    getOffset6p(tileCenter, leftX, rightX, bottomY, topY, tileCollisionType) {

        let posX, posY, sizeX, sizeY;

        const leftTileEdge = tileCenter[0] - cTileSize / 2;
        const rightTileEdge = leftTileEdge + cTileSize;
        const bottomTileEdge = tileCenter[1] - cTileSize / 2;
        const topTileEdge = bottomTileEdge + cTileSize;
        let offset;

        if (!this.isFlipped90(tileCollisionType)) {
            if (this.isFlippedX(tileCollisionType)) {
                posX = Math.floor(clamp(rightTileEdge - rightX, 0.0, cTileSize - 1));
                sizeX = Math.floor(clamp((rightTileEdge - posX) - leftX, 0.0, cTileSize - 1));
            }
            else {
                posX = Math.floor(clamp(leftX - leftTileEdge, 0.0, cTileSize - 1));
                sizeX = Math.floor(clamp(rightX - (leftTileEdge + posX), 0.0, cTileSize - 1));
            }

            if (this.isFlippedY(tileCollisionType)) {
                posY = Math.floor(clamp(topTileEdge - topY, 0.0, cTileSize - 1));
                sizeY = Math.floor(clamp((topTileEdge - posY) - bottomY, 0.0, cTileSize - 1));
            }
            else {
                posY = Math.floor(clamp(bottomY - bottomTileEdge, 0.0, cTileSize - 1));
                sizeY = Math.floor(clamp(topY - (bottomTileEdge + posY), 0.0, cTileSize - 1));
            }

            offset = SlopeOffsetI.from(this.slopeOffsets[tileCollisionType][posX][posY][sizeX][sizeY]);

            if (this.isFlippedY(tileCollisionType)) {
                let tmp = offset.freeDown;
                offset.freeDown = -offset.freeUp;
                offset.freeUp = -tmp;
                tmp = offset.collidingTop;
                offset.collidingTop = -offset.collidingBottom;
                offset.collidingBottom = -tmp;
            }
        }
        else {
            if (this.isFlippedY(tileCollisionType)) {
                posX = Math.floor(clamp(bottomY - bottomTileEdge, 0.0, cTileSize - 1));
                sizeX = Math.floor(clamp(topY - (bottomTileEdge + posX), 0.0, cTileSize - 1));
            }
            else {
                posX = Math.floor(clamp(topTileEdge - topY, 0.0, cTileSize - 1));
                sizeX = Math.floor(clamp((topTileEdge - posX) - bottomY, 0.0, cTileSize - 1));
            }

            if (this.isFlippedX(tileCollisionType)) {
                posY = Math.floor(clamp(rightTileEdge - rightX, 0.0, cTileSize - 1));
                sizeY = Math.floor(clamp((rightTileEdge - posY) - leftX, 0.0, cTileSize - 1));
            }
            else {
                posY = Math.floor(clamp(leftX - leftTileEdge, 0.0, cTileSize - 1));
                sizeY = Math.floor(clamp(rightX - (leftTileEdge + posY), 0.0, cTileSize - 1));
            }

            offset = SlopeOffsetI.from(this.slopeOffsets[tileCollisionType][posX][posY][sizeX][sizeY]);

            if (this.isFlippedY(tileCollisionType)) {
                offset.collidingBottom = offset.collidingLeft;
                offset.freeDown = offset.freeLeft;
                offset.collidingTop = offset.collidingRight;
                offset.freeUp = offset.freeRight;
            }
            else {
                offset.collidingBottom = -offset.collidingRight;
                offset.freeDown = -offset.freeRight;
                offset.collidingTop = -offset.collidingLeft;
                offset.freeUp = -offset.freeLeft;
            }
        }

        if (topTileEdge < topY) {
            if (offset.freeDown < 0)
                offset.freeDown -= Math.floor(topY - topTileEdge);
            offset.collidingTop = offset.freeDown;
        }
        if (bottomTileEdge > bottomY) {
            if (offset.freeUp > 0)
                offset.freeUp += Math.floor(bottomTileEdge) - Math.floor(bottomY);
            offset.collidingBottom = offset.freeUp;
        }
        return offset;
    },
    /**
     * 
     * @param {boolean[]} slopeExtended 
     * @returns {SlopeOffsetSB[][][][]}
     */
    cacheSlopeOffsets(slopeExtended) {
        /** @type {SlopeOffsetSB[][][][]} */
        const offsetCache = [];
        const len = Math.sqrt(slopeExtended.length);
        for (let x = 0; x < len; ++x) {
            offsetCache[x] = [];

            for (let y = 0; y < len; ++y) {
                offsetCache[x][y] = [];
                for (let w = 0; w < len; ++w) {
                    offsetCache[x][y][w] = [];
                    for (let h = 0; h < len; ++h) {
                        offsetCache[x][y][w][h] = this.getOffset5p(slopeExtended, x, y, w, h);
                    }
                }
            }
        }
        return offsetCache;
    },

    /**
     * 
     * @param {EnumValue<TileCollisionType>} type 
     * @returns {boolean}
     */
    isOneWay(type) {
        return (type > TileCollisionType.OneWayStart && type < TileCollisionType.OneWayEnd);
    },

    /**
     * 
     * @param {number} x 
     * @param {EnumValue<TileCollisionType>} type 
     * @returns {number}
     */
    getSlopeHeightFromBottom(x, type) {
        switch (type) {
            case TileCollisionType.Empty:
                return 0;
            case TileCollisionType.Full:
            case TileCollisionType.OneWayFull:
                return cTileSize;
        }
        if (this.isFlippedX(type))
            x = cTileSize - 1 - x;

        if (!this.isFlipped90(type)) {
            const offset = SlopeOffsetI.from(this.slopeOffsets[type][x][0][0][cTileSize - 1]);
            return this.isFlippedY(type) ? -offset.collidingTop : offset.collidingBottom;
        } else {
            const offset = SlopeOffsetI.from(this.slopeOffsets[type][0][x][cTileSize - 1][0]);
            return this.isFlippedY(type) ? offset.collidingLeft : -offset.collidingRight;
        }
    },
    /**
     * 
     * @param {EnumValue<TileCollisionType>} type 
     * @returns {boolean}
     */
    isFlippedX(type) {
        const typeId = (type - (TileCollisionType.SlopesStart + 1)) % 8;
        switch (typeId) {
            case 1:
            case 3:
            case 5:
            case 7:
                return true;
        }
        return false;
    },
    /**
     * 
     * @param {EnumValue<TileCollisionType>} type 
     * @returns {boolean}
     */
    isFlippedY(type) {
        const typeId = (type - (TileCollisionType.SlopesStart + 1)) % 8;
        switch (typeId) {
            case 2:
            case 3:
            case 6:
            case 7:
                return true;
        }
        return false;
    },
    /**
     * 
     * @param {EnumValue<TileCollisionType>} type 
     * @returns {boolean}
     */
    isFlipped90(type) {
        const typeId = (type - (TileCollisionType.SlopesStart + 1)) % 8;
        return (typeId > 3);
    },

}