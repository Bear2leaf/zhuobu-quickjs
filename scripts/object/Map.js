import { SpriteRenderer } from "../component/SpriteRenderer.js";
import { vec2, vec3 } from "../libs.js";
import { cTileSize } from "../misc/constants.js";
import { TileCollisionType } from "../misc/enums.js";
import { CollisionData } from "./CollisionData.js";
import { MovingObject } from "./MovingObject.js";
const mw = 80;
const mh = 50;
const collisionsData = Object.freeze(new Array(mw * mh).fill(TileCollisionType.Empty).map((tile, index) => {
    // add border
    if (index % mw === 0 || index % mw === mw - 1 || Math.floor(index / mw) === 0 || Math.floor(index / mw) === mh - 1) {
        return TileCollisionType.Full;
    }
    if (Math.floor(index / mw) < 5) {
        return TileCollisionType.Full;
    } else if (Math.floor(index / mw) < 30) {
        return Math.random() < 0.02 ? TileCollisionType.Full : Math.random() < 0.02 ? TileCollisionType.OneWaySlope45 : TileCollisionType.Empty;
    }
    return TileCollisionType.Empty;
}));
export class Map {
    constructor() {
        this.spriteRenderer = new SpriteRenderer();
        this.mPosition = vec3.create();
        this.mWidth = mw;
        this.mHeight = mh;
        this.mGridAreaWidth = 16;
        this.mGridAreaHeight = 16;
        this.mHorizontalAreasCount = Math.ceil(this.mWidth / this.mGridAreaWidth);
        this.mVerticalAreasCount = Math.ceil(this.mHeight / this.mGridAreaHeight);
        /** @type {(MovingObject[])[]} */
        this.mObjectsInArea = [];
        for (let y = 0; y < this.mVerticalAreasCount; ++y) {
            for (let x = 0; x < this.mHorizontalAreasCount; ++x)
                this.mObjectsInArea[y * this.mHorizontalAreasCount + x] = [];
        }
        /** @type {vec2[]} */
        this.mOverlappingAreas = [];
        /** @type {Readonly<EnumValue<typeof TileCollisionType>[]>} */
        this.mTilesCollision = collisionsData;
    }
    checkCollisions() {
        /** @type {{overlap: vec2}} */
        const out = { overlap: vec2.create() };
        for (let y = 0; y < this.mVerticalAreasCount; ++y) {
            for (let x = 0; x < this.mHorizontalAreasCount; ++x) {
                const objectsInArea = this.mObjectsInArea[y * this.mHorizontalAreasCount + x];
                for (let i = 0; i < objectsInArea.length - 1; ++i) {
                    const obj1 = objectsInArea[i];
                    for (let j = i + 1; j < objectsInArea.length; ++j) {
                        const obj2 = objectsInArea[j];
                        if (obj1.mAABB.overlapsSigned(obj2.mAABB, out) && !obj1.hasCollisionDataFor(obj2)) {
                            obj1.mAllCollidingObjects.push(new CollisionData(obj2, out.overlap, obj1.mSpeed, obj2.mSpeed, obj1.mOldPosition, obj2.mOldPosition, obj1.mPosition, obj2.mPosition));
                            obj2.mAllCollidingObjects.push(new CollisionData(obj1, [-out.overlap[0], -out.overlap[1]], obj2.mSpeed, obj1.mSpeed, obj2.mOldPosition, obj1.mOldPosition, obj2.mPosition, obj1.mPosition));
                        }
                    }
                }
            }
        }
    }
    /**
     * 
     * @param {MovingObject} obj 
     */
    updateAreas(obj) {
        const topLeft = this.getMapTileAtPoint(vec2.add(vec2.create(), obj.mAABB.center, [-obj.mAABB.halfSize[0], obj.mAABB.halfSize[1]]));
        const topRight = this.getMapTileAtPoint(vec2.add(vec2.create(), obj.mAABB.center, obj.mAABB.halfSize));
        const bottomLeft = this.getMapTileAtPoint(vec2.sub(vec2.create(), obj.mAABB.center, obj.mAABB.halfSize));
        const bottomRight = vec2.create();
        topLeft[0] /= this.mGridAreaWidth;
        topLeft[1] /= this.mGridAreaHeight;
        vec2.floor(topLeft, topLeft);
        topRight[0] /= this.mGridAreaWidth;
        topRight[1] /= this.mGridAreaHeight;
        vec2.floor(topRight, topRight);
        bottomLeft[0] /= this.mGridAreaWidth;
        bottomLeft[1] /= this.mGridAreaHeight;
        vec2.floor(bottomLeft, bottomLeft);
        bottomRight[0] = topRight[0];
        bottomRight[1] = bottomLeft[1];

        if (topLeft[0] === topRight[0] && topLeft[1] === bottomLeft[1]) {
            this.mOverlappingAreas.push(topLeft);
        } else if (topLeft[0] === topRight[0]) {
            this.mOverlappingAreas.push(topLeft);
            this.mOverlappingAreas.push(bottomLeft);
        } else if (topLeft[1] === bottomLeft[1]) {
            this.mOverlappingAreas.push(topLeft);
            this.mOverlappingAreas.push(topRight);
        } else {
            this.mOverlappingAreas.push(topLeft);
            this.mOverlappingAreas.push(bottomLeft);
            this.mOverlappingAreas.push(topRight);
            this.mOverlappingAreas.push(bottomRight);
        }
        const areas = obj.mAreas;
        const ids = obj.mIdsInAreas;
        // if (obj.mType === ObjectType.Player) {
        //     console.log("++++++++++++++++++++++++++++++");
        //     console.log(obj.mType, areas.length, ...areas);
        // }
        for (let i = 0; i < areas.length; ++i) {

            // if (obj.mType === ObjectType.Player) {
            //     console.log(i, areas[i], ...this.mOverlappingAreas, this.mOverlappingAreas.every((a) => a[0] !== areas[i][0] || a[1] !== areas[i][1]));
            // }
            if (this.mOverlappingAreas.every((a) => a[0] !== areas[i][0] || a[1] !== areas[i][1])) {
                this.removeObjectFromArea(areas[i], ids[i], obj);
                //object no longer has an index in the area 
                areas.splice(i, 1);
                ids.splice(i, 1);
                --i;
            }
        }
        for (let i = 0; i < this.mOverlappingAreas.length; ++i) {
            const area = this.mOverlappingAreas[i];
            if (areas.every((a) => a[0] !== area[0] || a[1] !== area[1])) {
                this.addObjectToArea(area, obj);
            }
        }
        this.mOverlappingAreas.splice(0, this.mOverlappingAreas.length);

    }
    /**
     * @param {vec2} areaIndex
     * @param {MovingObject} obj 
     */
    addObjectToArea(areaIndex, obj) {
        const area = this.mObjectsInArea[areaIndex[1] * this.mHorizontalAreasCount + areaIndex[0]];
        //save the index of the object in the area 
        obj.mAreas.push(areaIndex);
        obj.mIdsInAreas.push(area.length);
        //add the object to the area 
        area.push(obj);
    }
    /**
     * 
     * @param {vec2} areaIndex 
     * @param {number} objIndexInArea 
     * @param {MovingObject} obj 
     */
    removeObjectFromArea(areaIndex, objIndexInArea, obj) {
        const area = this.mObjectsInArea[areaIndex[1] * this.mHorizontalAreasCount + areaIndex[0]];
        //swap the last item with the one we are removing
        const tmp = area[area.length - 1];
        area[area.length - 1] = obj;
        area[objIndexInArea] = tmp;
        const tmpIds = tmp.mIdsInAreas;
        const tmpAreas = tmp.mAreas;
        for (let i = 0; i < tmpAreas.length; ++i) {
            if (tmpAreas[i][0] === areaIndex[0] && tmpAreas[i][1] === areaIndex[1]) {
                tmpIds[i] = objIndexInArea;
                break;
            }
        }
        //remove the last item
        area.pop();
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
     * @returns {boolean}
     */
    isObstacle(x, y) {
        if (x < 0 || x >= this.mWidth || y < 0 || y >= this.mHeight) {
            return true;
        }
        return this.mTilesCollision[y * this.mWidth + x] === TileCollisionType.Full;
    }
    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @returns {EnumValue<TileCollisionType>}
     */
    getCollisionType(x, y) {
        if (x <= -1 || x >= this.mWidth
            || y <= -1 || y >= this.mHeight)
            return TileCollisionType.Empty;
        return this.mTilesCollision[y * this.mWidth + x];
    }
}


