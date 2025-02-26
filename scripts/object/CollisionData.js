import { vec2 } from "../libs.js";
import { MovingObject } from "./MovingObject.js";

export class CollisionData {
    /**
     * 
     * @param {MovingObject} other 
     * @param {vec2} overlap 
     * @param {vec2} speed1 
     * @param {vec2} speed2 
     * @param {vec2} oldPos1 
     * @param {vec2} oldPos2 
     * @param {vec2} pos1 
     * @param {vec2} pos2 
     **/
    constructor(other, overlap = vec2.create(), speed1 = vec2.create(), speed2 = vec2.create(), oldPos1 = vec2.create(), oldPos2 = vec2.create(), pos1 = vec2.create(), pos2 = vec2.create()) {
        this.other = other;
        this.overlap = overlap;
        this.speed1 = speed1;
        this.speed2 = speed2;
        this.oldPos1 = oldPos1;
        this.oldPos2 = oldPos2;
        this.pos1 = pos1;
        this.pos2 = pos2;
    }
}