import { vec2 } from "../libs.js";
import { sign } from "../misc/math.js";

export class AABB {
    get halfSize() {
        return vec2.fromValues(
            this.mHalfSize[0] * this.scale[0],
            this.mHalfSize[1] * this.scale[1]
        );
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

    /**
     * 
     * @param {AABB} other
     * @param {{overlap: vec2}} out
     * @returns {boolean}
     */
    overlapsSigned(other, out) {
        vec2.zero(out.overlap);
        if (this.halfSize[0] === 0.0 || this.halfSize[1] === 0.0 || other.halfSize[0] === 0.0 || other.halfSize[1] === 0.0
            || Math.abs(this.center[0] - other.center[0]) > this.halfSize[0] + other.halfSize[0]
            || Math.abs(this.center[1] - other.center[1]) > this.halfSize[1] + other.halfSize[1]) return false;
        out.overlap[0] = sign(this.center[0] - other.center[0]) * ((other.halfSize[0] + this.halfSize[0]) - Math.abs(this.center[0] - other.center[0]));
        out.overlap[1] = sign(this.center[1] - other.center[1]) * ((other.halfSize[1] + this.halfSize[1]) - Math.abs(this.center[1] - other.center[1]));
        return true;
    }
    max() {
        return vec2.add(vec2.create(), this.center, this.halfSize);
    }
    min() {
        return vec2.sub(vec2.create(), this.center, this.halfSize);
    }
}


