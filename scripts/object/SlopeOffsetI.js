import { SlopeOffsetSB } from "./SlopeOffsetSB.js";

export class SlopeOffsetI {
    /**
     * 
     * @param {number} freeLeft 
     * @param {number} freeRight 
     * @param {number} freeDown 
     * @param {number} freeUp 
     * @param {number} collidingLeft 
     * @param {number} collidingRight 
     * @param {number} collidingBottom 
     * @param {number} collidingTop 
     */
    constructor(freeLeft, freeRight, freeDown, freeUp, collidingLeft, collidingRight, collidingBottom, collidingTop) {
        this.freeLeft = Math.floor(freeLeft);
        this.freeRight = Math.floor(freeRight);
        this.freeDown = Math.floor(freeDown);
        this.freeUp = Math.floor(freeUp);
        this.collidingLeft = Math.floor(collidingLeft);
        this.collidingRight = Math.floor(collidingRight);
        this.collidingBottom = Math.floor(collidingBottom);
        this.collidingTop = Math.floor(collidingTop);
    }
    /**
     * 
     * @param {SlopeOffsetSB} other 
     * @returns {SlopeOffsetI}
     */
    static from(other) {
        return new SlopeOffsetI(other.freeLeft, other.freeRight, other.freeDown, other.freeUp, other.collidingLeft, other.collidingRight, other.collidingBottom, other.collidingTop);
    }
}