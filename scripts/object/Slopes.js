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
        for (let x = 0; x < cTileSize; ++x) {
            for (let y = 0; y < cTileSize; ++y)
                extended[x * cTileSize + y] = (y < slope[y]) ? true : false;
        }
        return extended;
    },
    init() {
        Object.assign(this, {
            slopesHeights: [],
            slopesExtended: [],
            slopeOffsets: [],
        });
        for (let i = 0; i < Object.keys(TileCollisionType).length; ++i) {
            switch (i) {
                case TileCollisionType.Empty:
                    this.slopesHeights[i] = this.empty;
                    this.slopesExtended[i] = this.extend(this.slopesHeights[i]);
                    break;
                case TileCollisionType.Full:
                    this.slopesHeights[i] = this.full;
                    this.slopesExtended[i] = this.extend(this.slopesHeights[i]);
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
                    this.slopesHeights[i] = this.slopesHeights[TileCollisionType.Slope45];
                    this.slopesExtended[i] = this.slopesExtended[TileCollisionType.Slope45];
                    this.slopeOffsets[i] = this.slopeOffsets[TileCollisionType.Slope45];

                    break;
                case TileCollisionType.SlopeMid1:
                    this.slopesHeights[i] = this.slopeMid1;
                    this.slopesExtended[i] = this.extend(this.slopesHeights[i]);
                    break;
                case TileCollisionType.SlopeMid1FX:
                case TileCollisionType.SlopeMid1FY:
                case TileCollisionType.SlopeMid1FXY:
                case TileCollisionType.SlopeMid1F90:
                case TileCollisionType.SlopeMid1F90X:
                case TileCollisionType.SlopeMid1F90XY:
                case TileCollisionType.SlopeMid1F90Y:
                    this.slopesHeights[i] = this.slopesHeights[TileCollisionType.SlopeMid1];
                    this.slopesExtended[i] = this.slopesExtended[TileCollisionType.SlopeMid1];
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
        for (let x = posX; x <= posX + w && x < cTileSize; ++x) {
            for (let y = posY; y <= posY + h && y < cTileSize; ++y) {
                return slopeExtended[x * cTileSize + y];
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
        let freeUp = 0, freeDown = 0, collidingTop = 0, collidingBottom = 0;
        let freeLeft = 0, freeRight = 0, collidingLeft = 0, collidingRight = 0;
        let movH = h;
        while (movH >= 0 && posY + freeUp < cTileSize && this.collides(slopeExtended, posX, (posY + freeUp), w, movH)) {
            if (posY + freeUp == cTileSize)
                --movH;
            ++freeUp;
        }
        movH = h;
        while (movH >= 0 && posY + freeDown >= 0 && this.collides(slopeExtended, posX, (posY + freeDown), w, movH)) {
            if (posY + freeDown == 0)
                --movH;
            else
                --freeDown;
        }
        freeDown -= (h - movH);
        let movW = w;
        while (movW >= 0 && posY + freeRight < cTileSize && this.collides(slopeExtended, (posX + freeRight), posY, movW, h)) {
            if (posX + freeRight == cTileSize)
                --movW;
            ++freeRight;
        }
        movW = w;
        while (movW >= 0 && posX + freeLeft >= 0 && this.collides(slopeExtended, (posX + freeLeft), posY, movW, h)) {
            if (posX + freeLeft == 0)
                --movW;
            else
                --freeLeft;
        }
        freeLeft -= (w - movW);
        if (freeUp == 0) {
            while (posY + h + collidingTop < cTileSize && !this.collides(slopeExtended, posX, (posY + collidingTop), w, h))
                ++collidingTop;
            collidingTop -= 1;
            while (posY + collidingBottom >= 0 && !this.collides(slopeExtended, posX, (posY + collidingBottom), w, h))
                --collidingBottom;
            collidingBottom += 1;
        }
        else {
            collidingBottom = freeUp;
            collidingTop = freeDown;
        }
        if (freeRight == 0) {
            while (posX + w + collidingRight < cTileSize && !this.collides(slopeExtended, (posX + collidingRight), posY, w, h))
                ++collidingRight;
            collidingRight -= 1;
            while (posX + collidingLeft >= 0 && !this.collides(slopeExtended, (posX + collidingLeft), posY, w, h))
                --collidingLeft;
            collidingLeft += 1;
        }
        else {
            collidingLeft = freeRight;
            collidingRight = freeLeft;
        }
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
        let offset;
        const leftTileEdge = tileCenter[0] - cTileSize / 2;
        const rightTileEdge = leftTileEdge + cTileSize;
        const bottomTileEdge = tileCenter[1] - cTileSize / 2;
        const topTileEdge = bottomTileEdge + cTileSize;

        posX = Math.floor(clamp(leftX - leftTileEdge, 0.0, cTileSize - 1));
        sizeX = Math.floor(clamp(rightX - (leftTileEdge + posX), 0.0, cTileSize - 1));
        posY = Math.floor(clamp(bottomY - bottomTileEdge, 0.0, cTileSize - 1));
        sizeY = Math.floor(clamp(topY - (bottomTileEdge + posY), 0.0, cTileSize - 1));
        offset = SlopeOffsetI.from(this.slopeOffsets[tileCollisionType][posX][posY][sizeX][sizeY]);
        if (bottomTileEdge > bottomY) {
            if (offset.freeUp > 0)
                offset.freeUp += bottomTileEdge - bottomY;
            offset.collidingBottom = offset.freeUp;
        }
        if (topTileEdge < topY) {
            if (offset.freeDown < 0)
                offset.freeDown -= (topY - topTileEdge);
            offset.collidingTop = offset.freeDown;
        }
        if (bottomTileEdge > bottomY) {
            if (offset.freeUp > 0)
                offset.freeUp += bottomTileEdge - bottomY;
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
        for (let x = 0; x < cTileSize; ++x) {
            offsetCache[x] = [];

            for (let y = 0; y < cTileSize; ++y) {
                offsetCache[x][y] = [];
                for (let w = 0; w < cTileSize; ++w) {
                    offsetCache[x][y][w] = [];
                    for (let h = 0; h < cTileSize; ++h) {
                        offsetCache[x][y][w][h] = this.getOffset5p(slopeExtended, x, y, w, h);
                    }
                }
            }
        }
        return offsetCache;
    }
}