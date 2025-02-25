import { AABB } from "./AABB.js";
import { getScreenHeight, getScreenWidth, getTime, vec2, vec3 } from "../libs.js";
import { cOneWayPlatformThreshold, cTileSize } from "../misc/constants.js";
import { Map } from "./Map.js";

export class MovingObject {
    get position() {
        return vec3.fromValues(Math.round(this.mPosition[0]), Math.round(this.mPosition[1]), 0.0);
    }
    get localScale() {
        return vec3.fromValues(this.mScale[0], this.mScale[1], 1.0);
    }
    constructor() {

        this.mOldPosition = vec2.create();
        this.mPosition = vec2.fromValues(getScreenWidth() / 2, getScreenHeight() / 2);

        this.mOldSpeed = vec2.create();
        this.mSpeed = vec2.create();

        this.mScale = vec2.create();
        this.mAABB = new AABB();
        this.mAABBOffset = vec2.create();
        this.mPushedRightWall = false;
        this.mPushesRightWall = false;
        this.mPushedLeftWall = false;
        this.mPushesLeftWall = false;
        this.mWasOnGround = false;
        this.mOnGround = false;
        this.mOnOneWayPlatform = false;
        this.mWasAtCeiling = false;
        this.mAtCeiling = false;
        this.deltaTime = 0;
        this.mMap = new Map();
    }
    updatePhysics() {
        vec2.copy(this.mOldPosition, this.mPosition);
        vec2.copy(this.mOldSpeed, this.mSpeed);

        this.mWasOnGround = this.mOnGround;
        this.mPushedRightWall = this.mPushesRightWall;
        this.mPushedLeftWall = this.mPushesLeftWall;
        this.mWasAtCeiling = this.mAtCeiling;
        vec2.scaleAndAdd(this.mPosition, this.mPosition, this.mSpeed, this.deltaTime);

        const out = { groundY: 0, onOneWayPlatform: false, wallX: 0, ceilingY: 0 };

        if (this.mSpeed[1] <= 0.0
            && this.hasGround(this.mOldPosition, this.mPosition, this.mSpeed, out)) {
            this.mPosition[1] = out.groundY + this.mAABB.halfSize[1] - this.mAABBOffset[1];
            this.mSpeed[1] = 0.0;
            this.mOnGround = true;
        } else {
            this.mOnGround = false;
        }
        if (this.mSpeed[1] >= 0.0
            && this.hasCeiling(this.mOldPosition, this.mPosition, out)) {
            this.mPosition[1] = out.ceilingY - this.mAABB.halfSize[1] - this.mAABBOffset[1] - 1;
            this.mSpeed[1] = 0.0;
            this.mAtCeiling = true;
        } else {
            this.mAtCeiling = false;
        }
        if (this.mSpeed[0] <= 0.0
            && this.collidesWithLeftWall(this.mOldPosition, this.mPosition, out)) {
            const leftWallX = out.wallX;
            if ((this.mOldPosition[0] + 1) - this.mAABB.halfSize[0] + this.mAABBOffset[0] >= leftWallX) {
                this.mPosition[0] = leftWallX + this.mAABB.halfSize[0] - this.mAABBOffset[0];
                this.mPushesLeftWall = true;
            }
            this.mSpeed[0] = Math.max(this.mSpeed[0], 0.0);
        }
        else
            this.mPushesLeftWall = false;
        if (this.mSpeed[0] >= 0.0
            && this.collidesWithRightWall(this.mOldPosition, this.mPosition, out)) {
            const rightWallX = out.wallX;
            if ((this.mOldPosition[0] - 1) + this.mAABB.halfSize[0] - this.mAABBOffset[0] <= rightWallX) {
                this.mPosition[0] = rightWallX - this.mAABB.halfSize[0] + this.mAABBOffset[0];
                this.mPushesRightWall = true;
            }
            this.mSpeed[0] = Math.min(this.mSpeed[0], 0.0);
        }
        else
            this.mPushesRightWall = false;

        this.mOnOneWayPlatform = out.onOneWayPlatform;
        vec2.add(this.mAABB.center, this.mPosition, this.mAABBOffset);

    }
    /**
     * 
     * @param {vec2} oldPosition 
     * @param {vec2} position 
     * @param {vec2} speed 
     * @param {{groundY: number, onOneWayPlatform: boolean}} out 
     * @returns {boolean}
     */
    hasGround(oldPosition, position, speed, out) {
        const oldCenter = vec2.create();
        vec2.add(oldCenter, oldPosition, this.mAABBOffset);
        const center = vec2.create();
        vec2.add(center, position, this.mAABBOffset);
        const oldBottomLeft = vec2.create();
        vec2.sub(oldBottomLeft, oldCenter, this.mAABB.halfSize);
        vec2.sub(oldBottomLeft, oldBottomLeft, vec2.fromValues(0.0, 1.0));
        vec2.add(oldBottomLeft, oldBottomLeft, vec2.fromValues(1.0, 0.0));
        vec2.round(oldBottomLeft, oldBottomLeft);
        const newBottomLeft = vec2.create();
        vec2.sub(newBottomLeft, center, this.mAABB.halfSize);
        vec2.sub(newBottomLeft, newBottomLeft, vec2.fromValues(0.0, 1.0));
        vec2.add(newBottomLeft, newBottomLeft, vec2.fromValues(1.0, 0.0));
        vec2.round(newBottomLeft, newBottomLeft);
        const newBottomRight = vec2.create();
        newBottomRight[0] = newBottomLeft[0] + this.mAABB.halfSize[0] * 2.0 - 2.0;
        newBottomRight[1] = newBottomLeft[1];
        vec2.round(newBottomRight, newBottomRight);
        const endY = this.mMap.getMapTileYAtPoint(newBottomLeft[1]);
        const begY = Math.max(this.mMap.getMapTileYAtPoint(oldBottomLeft[1]) - 1, endY);
        const dist = Math.max(Math.abs(endY - begY), 1);
        let tileIndexX;
        for (let tileIndexY = begY; tileIndexY >= endY; --tileIndexY) {
            const bottomLeft = lerpVec2(newBottomLeft, oldBottomLeft, Math.abs(endY - tileIndexY) / dist);
            const bottomRight = vec2.fromValues(bottomLeft[0] + this.mAABB.halfSize[0] * 2.0 - 2.0, bottomLeft[1]);
            const checkedTile = vec2.create();
            vec2.copy(checkedTile, bottomLeft);
            for (; ; checkedTile[0] += cTileSize) {
                checkedTile[0] = Math.min(checkedTile[0], bottomRight[0]);

                tileIndexX = this.mMap.getMapTileXAtPoint(checkedTile[0]);

                out.groundY = tileIndexY * cTileSize + cTileSize / 2.0 + this.mMap.mPosition[1];
                if (this.mMap.isObstacle(tileIndexX, tileIndexY)) {
                    out.onOneWayPlatform = false;
                    return true;
                } else if (this.mMap.isOneWayPlatform(tileIndexX, tileIndexY)
                    && Math.abs(checkedTile[1] - out.groundY) <= cOneWayPlatformThreshold + oldPosition[1] - position[1]) {
                    out.onOneWayPlatform = true;
                }
                if (checkedTile[0] >= bottomRight[0]) {
                    if (out.onOneWayPlatform) {
                        return true;
                    }
                    break;
                }
            }
        }
        return false;
    }
    /**
     * 
     * @param {vec2} oldPosition 
     * @param {vec2} position 
     * @param {{ceilingY: number}} out 
     * @returns {boolean}
     */
    hasCeiling(oldPosition, position, out) {
        const center = vec2.add(vec2.create(), position, this.mAABBOffset);
        const oldCenter = vec2.add(vec2.create(), oldPosition, this.mAABBOffset);
        out.ceilingY = 0.0;
        const oldTopRight = vec2.add(vec2.create(), oldCenter, this.mAABB.halfSize);
        vec2.add(oldTopRight, oldTopRight, vec2.fromValues(0.0, 1.0));
        vec2.sub(oldTopRight, oldTopRight, vec2.fromValues(1.0, 0.0));
        vec2.round(oldTopRight, oldTopRight);
        const newTopRight = vec2.add(vec2.create(), center, this.mAABB.halfSize);
        vec2.add(newTopRight, newTopRight, vec2.fromValues(0.0, 1.0));
        vec2.sub(newTopRight, newTopRight, vec2.fromValues(1.0, 0.0));
        vec2.round(newTopRight, newTopRight);
        const newTopLeft = vec2.create();
        newTopLeft[0] = newTopRight[0] - this.mAABB.halfSize[0] * 2.0 + 2.0;
        newTopLeft[1] = newTopRight[1];
        vec2.round(newTopLeft, newTopLeft);
        const endY = this.mMap.getMapTileYAtPoint(newTopRight[1]);
        const begY = Math.min(this.mMap.getMapTileYAtPoint(oldTopRight[1]) + 1, endY);
        const dist = Math.max(Math.abs(endY - begY), 1);
        let tileIndexX;
        for (let tileIndexY = begY; tileIndexY <= endY; ++tileIndexY) {
            const topRight = lerpVec2(newTopRight, oldTopRight, Math.abs(endY - tileIndexY) / dist);
            const topLeft = vec2.fromValues(topRight[0] - this.mAABB.halfSize[0] * 2.0 + 2.0, topRight[1]);
            const checkedTile = vec2.create();
            vec2.copy(checkedTile, topLeft);
            for (; ; checkedTile[0] += cTileSize) {
                checkedTile[0] = Math.min(checkedTile[0], topRight[0]);
                tileIndexX = this.mMap.getMapTileXAtPoint(checkedTile[0]);
                if (this.mMap.isObstacle(tileIndexX, tileIndexY)) {
                    out.ceilingY = tileIndexY * cTileSize - cTileSize / 2.0 + this.mMap.mPosition[1];
                    return true;
                }
                if (checkedTile[0] >= topRight[0]) {
                    break;
                }
            }
        }
        return false;
    }

    /**
     * 
     * @param {vec2} oldPosition 
     * @param {vec2} position 
     * @param {{wallX: number}} out 
     * @returns {boolean}
     */
    collidesWithLeftWall(oldPosition, position, out) {
        const center = vec2.add(vec2.create(), position, this.mAABBOffset);
        const oldCenter = vec2.add(vec2.create(), oldPosition, this.mAABBOffset);
        out.wallX = 0.0;
        const oldBottomLeft = vec2.sub(vec2.create(), oldCenter, this.mAABB.halfSize);
        vec2.sub(oldBottomLeft, oldBottomLeft, vec2.fromValues(1.0, 0.0));
        vec2.round(oldBottomLeft, oldBottomLeft);
        const newBottomLeft = vec2.sub(vec2.create(), center, this.mAABB.halfSize);
        vec2.sub(newBottomLeft, newBottomLeft, vec2.fromValues(1.0, 0.0));
        vec2.round(newBottomLeft, newBottomLeft);
        const newTopLeft = vec2.add(vec2.create(), newBottomLeft, vec2.fromValues(0.0, this.mAABB.halfSize[1] * 2.0));
        vec2.round(newTopLeft, newTopLeft);
        const endX = this.mMap.getMapTileXAtPoint(newBottomLeft[0]);
        const begX = Math.max(this.mMap.getMapTileXAtPoint(oldBottomLeft[0]) - 1, endX);
        const dist = Math.max(Math.abs(endX - begX), 1);
        let tileIndexY;
        for (let tileIndexX = begX; tileIndexX >= endX; --tileIndexX) {
            const bottomLeft = lerpVec2(newBottomLeft, oldBottomLeft, Math.abs(endX - tileIndexX) / dist);
            const topLeft = vec2.add(vec2.create(), bottomLeft, vec2.fromValues(0.0, this.mAABB.halfSize[1] * 2.0));
            const checkedTile = vec2.create();
            vec2.copy(checkedTile, bottomLeft);
            for (; ; checkedTile[1] += cTileSize) {
                checkedTile[1] = Math.min(checkedTile[1], topLeft[1]);
                tileIndexY = this.mMap.getMapTileYAtPoint(checkedTile[1]);
                if (this.mMap.isObstacle(tileIndexX, tileIndexY)) {
                    out.wallX = tileIndexX * cTileSize + cTileSize / 2.0 + this.mMap.mPosition[0];
                    return true;
                }
                if (checkedTile[1] >= topLeft[1]) {
                    break;
                }
            }
        }
        return false;
    }

    /**
     * 
     * @param {vec2} oldPosition 
     * @param {vec2} position 
     * @param {{wallX: number}} out 
     * @returns {boolean}
     */

    collidesWithRightWall(oldPosition, position, out) {
        const center = vec2.add(vec2.create(), position, this.mAABBOffset);
        const oldCenter = vec2.add(vec2.create(), oldPosition, this.mAABBOffset);
        out.wallX = 0.0;
        const oldBottomRight = vec2.add(vec2.create(), oldCenter, [this.mAABB.halfSize[0], -this.mAABB.halfSize[1]]);
        vec2.add(oldBottomRight, oldBottomRight, vec2.fromValues(1.0, 0.0));
        vec2.round(oldBottomRight, oldBottomRight);
        const newBottomRight = vec2.add(vec2.create(), center, [this.mAABB.halfSize[0], -this.mAABB.halfSize[1]]);
        vec2.add(newBottomRight, newBottomRight, vec2.fromValues(1.0, 0.0));
        vec2.round(newBottomRight, newBottomRight);
        const newTopRight = vec2.add(vec2.create(), newBottomRight, vec2.fromValues(0.0, this.mAABB.halfSize[1] * 2.0));
        vec2.round(newTopRight, newTopRight);
        const endX = this.mMap.getMapTileXAtPoint(newBottomRight[0]);
        const begX = Math.min(this.mMap.getMapTileXAtPoint(oldBottomRight[0]) + 1, endX);
        const dist = Math.max(Math.abs(endX - begX), 1);
        let tileIndexY;
        for (let tileIndexX = begX; tileIndexX <= endX; ++tileIndexX) {
            const bottomRight = lerpVec2(newBottomRight, oldBottomRight, Math.abs(endX - tileIndexX) / dist);
            const topRight = vec2.add(vec2.create(), bottomRight, vec2.fromValues(0.0, this.mAABB.halfSize[1] * 2.0));
            const checkedTile = vec2.create();
            vec2.copy(checkedTile, bottomRight);
            for (; ; checkedTile[1] += cTileSize) {
                checkedTile[1] = Math.min(checkedTile[1], topRight[1]);
                tileIndexY = this.mMap.getMapTileYAtPoint(checkedTile[1]);
                if (this.mMap.isObstacle(tileIndexX, tileIndexY)) {
                    out.wallX = tileIndexX * cTileSize - cTileSize / 2.0 + this.mMap.mPosition[0];
                    return true;
                }
                if (checkedTile[1] >= topRight[1]) {
                    break;
                }
            }
        }
        return false;
    }

}
/**
 * 
 * @param {vec2} a 
 * @param {vec2} b 
 * @param {number} t 
 * @returns {vec2}
 */
function lerpVec2(a, b, t) {
    return vec2.fromValues(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t);
}