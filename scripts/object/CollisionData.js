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
    constructor(other, overlap, speed1, speed2, oldPos1, oldPos2, pos1, pos2) {
        this.other = other;
        this.overlap = vec2.clone(overlap);
        this.speed1 = vec2.clone(speed1);
        this.speed2 = vec2.clone(speed2);
        this.oldPos1 = vec2.clone(oldPos1);
        this.oldPos2 = vec2.clone(oldPos2);
        this.pos1 = vec2.clone(pos1);
        this.pos2 = vec2.clone(pos2);
    }
}