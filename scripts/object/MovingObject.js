import { AABB } from "../component/AABB.js";
import { getTime, vec2, vec3 } from "../libs.js";

export class MovingObject {
    get position(){
        return vec3.fromValues(Math.round(this.mPosition[0]), Math.round(this.mPosition[1]), 0.0);
    }
    get localScale() {
        return vec3.fromValues(this.mScale[0], this.mScale[1], 1.0);
    }
    constructor() {

        this.mOldPosition = vec2.create();
        this.mPosition = vec2.create();

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
    }
    updatePhysics() {
        this.mOldPosition = this.mPosition;
        this.mOldSpeed = this.mSpeed;

        this.mWasOnGround = this.mOnGround;
        this.mPushedRightWall = this.mPushesRightWall;
        this.mPushedLeftWall = this.mPushesLeftWall;
        this.mWasAtCeiling = this.mAtCeiling;
        vec2.scaleAndAdd(this.mPosition, this.mPosition, this.mSpeed, this.deltaTime);
        if (this.mPosition[1] <= 0.0) {
            this.mPosition[1] = 0.0;
            this.mOnGround = true;
        } else {
            this.mOnGround = false;
        }
        vec2.add(this.mAABB.center,this.mPosition, this.mAABBOffset);


    }
}