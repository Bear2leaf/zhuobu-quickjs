import { vec2 } from "../libs.js";

export class AABB {
    get halfSize() {
        return [
            this.mHalfSize[0] * this.scale[0],
            this.mHalfSize[1] * this.scale[1]
        ];
    }
    set halfSize(value) {
        this.mHalfSize = vec2.fromValues(value[0], value[1]);
    }
    constructor() {
        this.scale = vec2.fromValues(1, 1);
        this.center = vec2.create();
        this.mHalfSize = vec2.create();
    }
    /**
     * 
     * @param {AABB} other 
     * @returns {boolean}
     */
    overlaps(other) {
        if (Math.abs(this.center[0] - other.center[0]) > this.halfSize[0] + other.halfSize[0]) return false;
        if (Math.abs(this.center[1] - other.center[1]) > this.halfSize[1] + other.halfSize[1]) return false;
        return true;
    }
}

