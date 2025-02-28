import { vec2 } from "../libs.js";
import { ObjectType } from "../misc/enums.js";
import { Map } from "./Map.js";
import { MovingObject } from "./MovingObject.js";

export class MovingPlatform extends MovingObject {

    /** @param {Map} map */
    constructor(map) {
        super(map);

        this.mAABB.halfSize = vec2.fromValues(32, 8);
        this.mSlopeWallHeight = 0;
        this.mMovingSpeed = 100.0;
        this.mIsKinematic = true;
        this.mSpeed[0] = this.mMovingSpeed;
    }
    init() {
        this.mAABB.halfSize = vec2.fromValues(32, 8);
        this.mSlopeWallHeight = 0;
        this.mMovingSpeed = 100.0;
        this.mIsKinematic = true;
        this.mSpeed[0] = this.mMovingSpeed;
    }
    customUpdate() {
        if (this.mPS.pushesRightTile && !this.mPS.pushesBottomTile)
            this.mSpeed[1] = -this.mMovingSpeed;
        else if (this.mPS.pushesBottomTile && !this.mPS.pushesLeftTile)
            this.mSpeed[0] = -this.mMovingSpeed;
        else if (this.mPS.pushesLeftTile && !this.mPS.pushesTopTile)
            this.mSpeed[1] = this.mMovingSpeed;
        else if (this.mPS.pushesTopTile && !this.mPS.pushesRightTile)
            this.mSpeed[0] = this.mMovingSpeed;

        this.updatePhysics();
    }
}