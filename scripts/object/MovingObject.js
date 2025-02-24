import { AABB } from "./AABB.js";
import { getScreenHeight, getScreenWidth, getTime, vec2, vec3 } from "../libs.js";
import { cTileSize } from "../misc/constants.js";
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
        this.mWasAtCeiling = false;
        this.mAtCeiling = false;
        this.deltaTime = 0;
        this.mMap = new Map();
    }
    updatePhysics() {
        this.mOldPosition = this.mPosition;
        this.mOldSpeed = this.mSpeed;

        this.mWasOnGround = this.mOnGround;
        this.mPushedRightWall = this.mPushesRightWall;
        this.mPushedLeftWall = this.mPushesLeftWall;
        this.mWasAtCeiling = this.mAtCeiling;
        vec2.scaleAndAdd(this.mPosition, this.mPosition, this.mSpeed, this.deltaTime);
        const out = { groundY: 0 };
        if (this.mSpeed[1] <= 0.0
            && this.hasGround(this.mOldPosition, this.mPosition, this.mSpeed, out)) {
            this.mPosition[1] = out.groundY + this.mAABB.halfSize[1] - this.mAABBOffset[1];
            this.mSpeed[1] = 0.0;
            this.mOnGround = true;
        }
        else
            this.mOnGround = false;
        vec2.add(this.mAABB.center, this.mPosition, this.mAABBOffset);


    }
    /**
     * 
     * @param {vec2} oldPosition 
     * @param {vec2} position 
     * @param {vec2} speed 
     * @param {{groundY: number}} out 
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
        const newBottomLeft = vec2.create();
        vec2.sub(newBottomLeft, center, this.mAABB.halfSize);
        vec2.sub(newBottomLeft, newBottomLeft, vec2.fromValues(0.0, 1.0));
        vec2.add(newBottomLeft, newBottomLeft, vec2.fromValues(1.0, 0.0));
        const newBottomRight = vec2.create();
        newBottomRight[0] = newBottomLeft[0] + this.mAABB.halfSize[0] * 2.0 - 2.0;
        newBottomRight[1] = newBottomLeft[1];
        const endY = this.mMap.getMapTileYAtPoint(newBottomLeft[1]);
        const begY = Math.max(this.mMap.getMapTileYAtPoint(oldBottomLeft[1]) - 1, endY);
        const dist = Math.max(Math.abs(endY - begY), 1);
        let tileIndexX;
        for (let tileIndexY = begY; tileIndexY >= endY; --tileIndexY) {
            const bottomLeft = lerpVec2(newBottomLeft, oldBottomLeft, Math.abs(endY - tileIndexY) / dist);
            const bottomRight = vec2.fromValues(bottomLeft[0] + this.mAABB.halfSize[0] * 2.0 - 2.0, bottomLeft[1]);
            for (const checkedTile = bottomLeft; ; checkedTile[0] += cTileSize) {
                checkedTile[0] = Math.min(checkedTile[0], bottomRight[0]);

                tileIndexX = this.mMap.getMapTileXAtPoint(checkedTile[0]);

                out.groundY = tileIndexY * cTileSize + cTileSize / 2.0 + this.mMap.mPosition[1];
                if (this.mMap.isObstacle(tileIndexX, tileIndexY))
                    return true;
                if (checkedTile[0] >= bottomRight[0])
                    break;
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