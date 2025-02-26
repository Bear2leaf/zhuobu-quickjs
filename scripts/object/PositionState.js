import { vec2 } from "../libs.js";

export class PositionState {
    constructor() {
        this.pushesRight = false;
        this.pushesLeft = false;
        this.pushesBottom = false;
        this.pushesTop = false;
        this.pushedTop = false;
        this.pushedBottom = false;
        this.pushedRight = false;
        this.pushedLeft = false;
        this.pushedLeftObject = false;
        this.pushedRightObject = false;
        this.pushedBottomObject = false;
        this.pushedTopObject = false;
        this.pushesLeftObject = false;
        this.pushesRightObject = false;
        this.pushesBottomObject = false;
        this.pushesTopObject = false;
        this.pushedLeftTile = false;
        this.pushedRightTile = false;
        this.pushedBottomTile = false;
        this.pushedTopTile = false;
        this.pushesLeftTile = false;
        this.pushesRightTile = false;
        this.pushesBottomTile = false;
        this.pushesTopTile = false;
        this.onOneWayPlatform = false;
        this.leftTile = vec2.fromValues(-1, -1);
        this.rightTile = vec2.fromValues(-1, -1);
        this.topTile = vec2.fromValues(-1, -1);
        this.bottomTile = vec2.fromValues(-1, -1);
    }
    reset() {
        this.leftTile = vec2.fromValues(-1, -1);
        this.rightTile = vec2.fromValues(-1, -1);
        this.topTile = vec2.fromValues(-1, -1);
        this.bottomTile = vec2.fromValues(-1, -1);
        this.pushesRight = false;
        this.pushesLeft = false;
        this.pushesBottom = false;
        this.pushesTop = false;
        this.pushedTop = false;
        this.pushedBottom = false;
        this.pushedRight = false;
        this.pushedLeft = false;
        this.pushedLeftObject = false;
        this.pushedRightObject = false;
        this.pushedBottomObject = false;
        this.pushedTopObject = false;
        this.pushesLeftObject = false;
        this.pushesRightObject = false;
        this.pushesBottomObject = false;
        this.pushesTopObject = false;
        this.pushedLeftTile = false;
        this.pushedRightTile = false;
        this.pushedBottomTile = false;
        this.pushedTopTile = false;
        this.pushesLeftTile = false;
        this.pushesRightTile = false;
        this.pushesBottomTile = false;
        this.pushesTopTile = false;
        this.onOneWayPlatform = false;
    }
}