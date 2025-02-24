import { vec2 } from "../libs.js";

export class AABB {
    constructor() {
        this.center = vec2.create();
        this.halfSize = vec2.create();
    }
    /**
     * 
     * @param {AABB} other 
     * @returns {boolean}
     */
    overlaps(other) {
        if ( Math.abs(this.center[0] - other.center[0]) > this.halfSize[0] + other.halfSize[0] ) return false;
        if ( Math.abs(this.center[1] - other.center[1]) > this.halfSize[1] + other.halfSize[1] ) return false;
        return true;
    }
}

