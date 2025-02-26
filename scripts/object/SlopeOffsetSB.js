export class SlopeOffsetSB {
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
        this.freeLeft = freeLeft;
        this.freeRight = freeRight;
        this.freeDown = freeDown;
        this.freeUp = freeUp;
        this.collidingLeft = collidingLeft;
        this.collidingRight = collidingRight;
        this.collidingBottom = collidingBottom;
        this.collidingTop = collidingTop;
    }

}