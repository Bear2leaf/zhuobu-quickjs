import { SpriteRenderer } from "../component/SpriteRenderer.js";
import { vec2, vec3 } from "../libs.js";
import { cTileSize } from "../misc/constants.js";
import { TileType } from "../misc/enums.js";
const mw = 80;
const mh = 60;
/**
 * @type {Readonly<EnumValue<typeof TileType>[]>}
 */
const mapData = Object.freeze(new Array(mw * mh).fill(TileType.Empty).map((tile, index) => {
    if (Math.floor(index / mw) < 10 || Math.random() < 0.1) {
        return TileType.Block;
    }
    return TileType.Empty;
}));
const spritesData = Object.freeze(mapData.map((tile) => {
    switch (tile) {
        case TileType.Block:
            return new SpriteRenderer();
        case TileType.OneWay:
            return new SpriteRenderer();
        case TileType.Empty:
            return null;
    }
}));
export class Map {
    constructor() {
        /** @type {Readonly<EnumValue<typeof TileType>[]>} */
        this.mTiles = mapData;
        /** @type {Readonly<(SpriteRenderer|null)[]>} */
        this.mTIlesSprites = spritesData;

        this.mPosition = vec3.create();
        this.mWidth = mw;
        this.mHeight = mh;
    }
    /**
     * 
     * @param {vec2} point 
     * @returns {vec2}
     */
    getMapTileAtPoint(point) {
        return [
            Math.floor((point[0] - this.mPosition[0] + cTileSize / 2.0) / (cTileSize)),
            Math.floor((point[1] - this.mPosition[1] + cTileSize / 2.0) / (cTileSize))
        ];
    }

    /**
     * 
     * @param {number} y 
     * @returns {number}
     */
    getMapTileYAtPoint(y) {
        return Math.floor((y - this.mPosition[1] + cTileSize / 2.0) / (cTileSize));
    }
    /**
     * 
     * @param {number} x 
     * @returns {number}
     */
    getMapTileXAtPoint(x) {
        return Math.floor((x - this.mPosition[0] + cTileSize / 2.0) / (cTileSize));
    }

    /**
     * @param {number} tileIndexX
     * @param {number} tileIndexY
     * @returns {vec2}
     */

    getMapTilePosition(tileIndexX, tileIndexY) {
        return vec2.fromValues(this.mPosition[0] + tileIndexX * cTileSize, this.mPosition[1] + tileIndexY * cTileSize);
    }

    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @returns {EnumValue<TileType>}
     */
    getTile(x, y) {
        if (x < 0 || x >= this.mWidth || y < 0 || y >= this.mHeight) {
            return TileType.Block;
        }
        return this.mTiles[y * this.mWidth + x];
    }

    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @returns {boolean}
     */
    isObstacle(x, y) {
        if (x < 0 || x >= this.mWidth || y < 0 || y >= this.mHeight) {
            return true;
        }
        return this.mTiles[y * this.mWidth + x] === TileType.Block;
    }
    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @returns {boolean}
     */
    isGround(x, y) {
        if (x < 0 || x >= this.mWidth || y < 0 || y >= this.mHeight) {
            return false;
        }
        return this.mTiles[y * this.mWidth + x] === TileType.OneWay || this.mTiles[y * this.mWidth + x] === TileType.Block;
    }

    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @returns {boolean}
     */
    isOneWayPlatform(x, y) {
        if (x < 0 || x >= this.mWidth || y < 0 || y >= this.mHeight) {
            return false;
        }
        return this.mTiles[y * this.mWidth + x] === TileType.OneWay;
    }
    /** 
     * 
     * @param {number} x 
     * @param {number} y 
     * @returns {boolean}
     */
    isEmpty(x, y) {
        if (x < 0 || x >= this.mWidth || y < 0 || y >= this.mHeight) {
            return false;
        }
        return this.mTiles[y * this.mWidth + x] === TileType.Empty;
    }
}