import { AABB } from "./AABB.js";
import { getScreenHeight, getScreenWidth, getTime, vec2, vec3 } from "../libs.js";
import { cOneWayPlatformThreshold, cTileSize } from "../misc/constants.js";
import { Map } from "./Map.js";
import { ObjectType, TileCollisionType } from "../misc/enums.js";
import { CollisionData } from "./CollisionData.js";
import { PositionState } from "./PositionState.js";
import { clamp, sign } from "../misc/math.js";
import { Slopes } from "./Slopes.js";
import { cSlopeWallHeight } from "../misc/constants.js";

export class MovingObject {
    get position() {
        return vec3.fromValues(Math.round(this.mPosition[0]), Math.round(this.mPosition[1]), 0.0);
    }
    get aabbOffset() {
        return vec2.fromValues(this.mAABBOffset[0] * this.mScale[0], this.mAABBOffset[1] * this.mScale[1]);
    }
    set aabbOffset(value) {
        this.mAABBOffset = vec2.fromValues(value[0], value[1]);
    }
    get scale() {
        return vec2.fromValues(this.mScale[0], this.mScale[1]);
    }
    set scale(value) {
        this.mScale = vec2.fromValues(value[0], value[1]);
        this.mAABB.scale = [Math.abs(this.mScale[0]), Math.abs(this.mScale[1])];
    }
    /** @param {Map} map */
    constructor(map) {

        this.mOldPosition = vec2.create();
        this.mPosition = vec2.fromValues(getScreenWidth() / 2, getScreenHeight() / 2);
        this.mRemainder = vec2.fromValues(getScreenWidth() / 2, getScreenHeight() / 2);
        this.mPS = new PositionState();
        this.mOldSpeed = vec2.create();
        this.mSpeed = vec2.create();

        this.mScale = vec2.fromValues(1, 1);
        this.mAABB = new AABB();
        this.mAABBOffset = vec2.create();




        this.deltaTime = 0;
        this.mMap = map;
        /** @type {vec2[]} */
        this.mAreas = [];
        /** @type {number[]} */
        this.mIdsInAreas = [];
        /** @type {EnumValue<typeof ObjectType>} */
        this.mType = ObjectType.NPC;

        /** @type {CollisionData[]} */
        this.mAllCollidingObjects = [];


        this.mIsKinematic = false;

        this.mIgnoresOneWay = false;
        this.mOnOneWayPlatform = false;
        this.mSticksToSlope = true;
        this.mIsKinematic = false;


    }
    customUpdate() {
    }
    /**
     * 
     * @param {{
     * position: vec2,
     * topRight: vec2,
     * bottomLeft: vec2,
     * state: PositionState,
     * move: boolean
     * }} ref
     * @returns {boolean}
     */
    collidesWithTileRight({ position, topRight, bottomLeft, state, move }) {
        const topRightTile = this.mMap.getMapTileAtPoint(vec2.fromValues(topRight[0] + 0.5, topRight[1] - 0.5));
        vec2.floor(topRightTile, topRightTile);
        const bottomLeftTile = this.mMap.getMapTileAtPoint(vec2.fromValues(bottomLeft[0] + 0.5, bottomLeft[1] + 0.5));
        vec2.floor(bottomLeftTile, bottomLeftTile);
        let slopeOffset = 0.0;
        let oldSlopeOffset = 0.0;
        let wasOneWay = false, isOneWay;

        /** @type {EnumValue<TileCollisionType>} */
        let slopeCollisionType = TileCollisionType.Empty;
        for (let y = bottomLeftTile[1]; y <= topRightTile[1]; ++y) {
            const tileCollisionType = this.mMap.getCollisionType(topRightTile[0], y);
            isOneWay = Slopes.isOneWay(tileCollisionType);
            if (isOneWay && (!move || this.mIgnoresOneWay || state.tmpIgnoresOneWay || y != bottomLeftTile[1]))
                continue;


            switch (tileCollisionType) {
                default://slope 
                    const tileCenter = this.mMap.getMapTilePosition(topRightTile[0], y);
                    const leftTileEdge = (tileCenter[0] - cTileSize / 2);
                    const rightTileEdge = (leftTileEdge + cTileSize);
                    const bottomTileEdge = (tileCenter[1] - cTileSize / 2);

                    
                    oldSlopeOffset = slopeOffset;

                    const offset = Slopes.getOffset6p(tileCenter, bottomLeft[0] + 0.5, topRight[0] + 0.5, bottomLeft[1] + 0.5, topRight[1] - 0.5, tileCollisionType);
                    slopeOffset = Math.abs(offset.freeUp) < Math.abs(offset.freeDown) ? offset.freeUp : offset.freeDown;
                    if (!isOneWay && (Math.abs(slopeOffset) >= cSlopeWallHeight || (slopeOffset < 0 && state.pushesBottomTile) || (slopeOffset > 0 && state.pushesTopTile))) {
                        state.pushesRightTile = true;
                        vec2.floor(state.rightTile, [topRightTile[0], y]);
                        return true;
                    }
                    else if (Math.abs(slopeOffset) > Math.abs(oldSlopeOffset)) {
                        wasOneWay = isOneWay;
                        slopeCollisionType = tileCollisionType;
                        vec2.floor(state.rightTile, [topRightTile[0], y]);
                    }
                    else
                        slopeOffset = oldSlopeOffset;
                    break;
                case TileCollisionType.Empty:
                    break;
            }
        }
        if (slopeCollisionType != TileCollisionType.Empty && slopeOffset != 0.0) {
            if (slopeOffset > 0 && slopeOffset < cSlopeWallHeight) {
                const pos = position, tr = topRight, bl = bottomLeft;
                pos[1] += slopeOffset - sign(slopeOffset);
                tr[1] += slopeOffset - sign(slopeOffset);
                bl[1] += slopeOffset - sign(slopeOffset);
                const s = new PositionState();
                const ref = { position: pos, topRight: tr, bottomLeft: bl, state: s, move };
                if (this.collidesWithTileTop(ref)) {
                    state.pushesRightTile = true;
                    return true;
                } else if (ref.move) {
                    position[1] += slopeOffset;
                    bottomLeft[1] += slopeOffset;
                    topRight[1] += slopeOffset;
                    state.pushesBottomTile = true;
                    state.onOneWay = wasOneWay;
                }
            }
            else if (slopeOffset < 0 && slopeOffset > -cSlopeWallHeight) {
                const pos = position, tr = topRight, bl = bottomLeft;
                pos[1] += slopeOffset - sign(slopeOffset);
                tr[1] += slopeOffset - sign(slopeOffset);
                bl[1] += slopeOffset - sign(slopeOffset);
                const s = new PositionState();
                const ref = { position: pos, topRight: tr, bottomLeft: bl, state: s, move };
                if (this.collidesWithTileBottom(ref)) {
                    state.pushesRightTile = true;
                    return true;
                } else if (ref.move) {

                    position[1] += slopeOffset;
                    bottomLeft[1] += slopeOffset;
                    topRight[1] += slopeOffset;
                    state.pushesTopTile = true;
                    state.onOneWay = wasOneWay;
                }
            }
        }
        if (this.mSticksToSlope && state.pushedBottomTile && move) {
            const nextX = this.mMap.getMapTileXAtPoint(bottomLeft[0] + 1.0);
            const bottomY = this.mMap.getMapTileYAtPoint(bottomLeft[1] + 1.0) - 1;

            const prevPos = this.mMap.getMapTilePosition(bottomLeftTile[0], bottomLeftTile[1]);
            const nextPos = this.mMap.getMapTilePosition(nextX, bottomY);
            const prevCollisionType = this.mMap.getCollisionType(bottomLeftTile[0], bottomLeftTile[1]);
            const nextCollisionType = this.mMap.getCollisionType(nextX, bottomY);

            const x1 = Math.floor(clamp((bottomLeft[0] - (prevPos[0] - cTileSize / 2)), 0.0, 15.0));
            const x2 = Math.floor(clamp((bottomLeft[0] + 1.0 - (nextPos[0] - cTileSize / 2)), 0.0, 15.0));

            const slopeHeight = Slopes.getSlopeHeightFromBottom(x1, prevCollisionType);
            const nextSlopeHeight = Slopes.getSlopeHeightFromBottom(x2, nextCollisionType);

            const offset = slopeHeight + cTileSize - nextSlopeHeight;

            if (offset < cSlopeWallHeight && offset > 0) {
                const pos = position, tr = topRight, bl = bottomLeft;
                pos[1] -= offset - sign(offset);
                tr[1] -= offset - sign(offset);
                bl[1] -= offset - sign(offset);
                bl[0] += 1.0;
                tr[0] += 1.0;
                const s = new PositionState();
                const ref = { position: pos, topRight: tr, bottomLeft: bl, state: s, move };
                if (!this.collidesWithTileBottom(ref)) {
                    position[1] -= offset;
                    bottomLeft[1] -= offset;
                    topRight[1] -= offset;
                    state.pushesBottomTile = true;
                    state.onOneWay = wasOneWay;
                }
            }
        }
        return false;
    }
    /**
     * 
     * @param {{
     * position: vec2,
     * topRight: vec2,
     * bottomLeft: vec2,
     * state: PositionState,
     * move: boolean
     * }} ref
     * @returns {boolean}
     */
    collidesWithTileLeft({ position, topRight, bottomLeft, state, move }) {
        const topRightTile = this.mMap.getMapTileAtPoint([topRight[0] - 0.5, topRight[1] - 0.5]);
        vec2.floor(topRightTile, topRightTile);
        const bottomLeftTile = this.mMap.getMapTileAtPoint([bottomLeft[0] - 0.5, bottomLeft[1] + 0.5]);
        vec2.floor(bottomLeftTile, bottomLeftTile);
        let slopeOffset = 0.0, oldSlopeOffset = 0.0;
        let wasOneWay = false, isOneWay;
        /** @type {EnumValue<TileCollisionType>} */
        let slopeCollisionType = TileCollisionType.Empty;
        for (let y = bottomLeftTile[1]; y <= topRightTile[1]; ++y) {
            const tileCollisionType = this.mMap.getCollisionType(bottomLeftTile[0], y);

            isOneWay = Slopes.isOneWay(tileCollisionType);

            if (isOneWay && (!move || this.mIgnoresOneWay || state.tmpIgnoresOneWay || y != bottomLeftTile[1]))
                continue;
            switch (tileCollisionType) {
                default://slope 
                    const tileCenter = this.mMap.getMapTilePosition(bottomLeftTile[0], y);
                    const leftTileEdge = (tileCenter[0] - cTileSize / 2);
                    const rightTileEdge = (leftTileEdge + cTileSize);
                    const bottomTileEdge = (tileCenter[1] - cTileSize / 2);
                    oldSlopeOffset = slopeOffset;
                    const offset = Slopes.getOffset6p(tileCenter, bottomLeft[0] - 0.5, topRight[0] - 0.5, bottomLeft[1] + 0.5, topRight[1] - 0.5, tileCollisionType);
                    slopeOffset = Math.abs(offset.freeUp) < Math.abs(offset.freeDown) ? offset.freeUp : offset.freeDown;
                    if (!isOneWay && (Math.abs(slopeOffset) >= cSlopeWallHeight || (slopeOffset < 0 && state.pushesBottomTile) || (slopeOffset > 0 && state.pushesTopTile))) {
                        state.pushesLeftTile = true;
                        vec2.floor(state.leftTile, [bottomLeftTile[0], y]);
                        return true;
                    }
                    else if (Math.abs(slopeOffset) > Math.abs(oldSlopeOffset)) {
                        wasOneWay = isOneWay;
                        slopeCollisionType = tileCollisionType;
                        vec2.floor(state.leftTile, [bottomLeftTile[0], y]);
                    }
                    else
                        slopeOffset = oldSlopeOffset;
                    break;
                case TileCollisionType.Empty:
                    break;
            }
        }
        if (slopeCollisionType != TileCollisionType.Empty && slopeOffset != 0) {
            if (slopeOffset > 0 && slopeOffset < cSlopeWallHeight) {
                const pos = position, tr = topRight, bl = bottomLeft;
                pos[1] += slopeOffset - sign(slopeOffset);
                tr[1] += slopeOffset - sign(slopeOffset);
                bl[1] += slopeOffset - sign(slopeOffset);
                const s = new PositionState();
                const ref = { position: pos, topRight: tr, bottomLeft: bl, state: s, move };
                if (this.collidesWithTileTop(ref)) {
                    state.pushesLeftTile = true;
                    return true;
                }
                else if (move) {
                    position[1] += slopeOffset;
                    bottomLeft[1] += slopeOffset;
                    topRight[1] += slopeOffset;
                    state.pushesBottomTile = true;
                    state.onOneWay = wasOneWay;
                }
            }
            else if (slopeOffset < 0 && slopeOffset > -cSlopeWallHeight) {
                const pos = position, tr = topRight, bl = bottomLeft;
                pos[1] += slopeOffset - sign(slopeOffset);
                tr[1] += slopeOffset - sign(slopeOffset);
                bl[1] += slopeOffset - sign(slopeOffset);
                const s = new PositionState();
                const ref = { position: pos, topRight: tr, bottomLeft: bl, state: s, move };
                if (this.collidesWithTileBottom(ref)) {
                    state.pushesLeftTile = true;
                    return true;
                }
                else if (move) {
                    position[1] += slopeOffset;
                    bottomLeft[1] += slopeOffset;
                    topRight[1] += slopeOffset;
                    state.pushesTopTile = true;
                    state.onOneWay = wasOneWay;
                }
            }
        }
        if (this.mSticksToSlope && state.pushedBottomTile && move) {
            const nextX = this.mMap.getMapTileXAtPoint(topRight[0] - 1.5);
            const bottomY = this.mMap.getMapTileYAtPoint(bottomLeft[1] + 1.0) - 1;

            const prevPos = this.mMap.getMapTilePosition(topRightTile[0], bottomLeftTile[1]);
            const nextPos = this.mMap.getMapTilePosition(nextX, bottomY);

            const prevCollisionType = this.mMap.getCollisionType(topRightTile[0], bottomLeftTile[1]);
            const nextCollisionType = this.mMap.getCollisionType(nextX, bottomY);

            const x1 = Math.floor(clamp((topRight[0] - 1.0 - (prevPos[0] - cTileSize / 2)), 0.0, 15.0));
            const x2 = Math.floor(clamp((topRight[0] - 1.5 - (nextPos[0] - cTileSize / 2)), 0.0, 15.0));

            const slopeHeight = Slopes.getSlopeHeightFromBottom(x1, prevCollisionType);
            const nextSlopeHeight = Slopes.getSlopeHeightFromBottom(x2, nextCollisionType);

            const offset = slopeHeight + cTileSize - nextSlopeHeight;

            if (offset < cSlopeWallHeight && offset > 0) {
                const pos = position, tr = topRight, bl = bottomLeft;
                pos[1] -= offset - sign(offset);
                tr[1] -= offset - sign(offset);
                bl[1] -= offset - sign(offset);
                bl[0] -= 1.0;
                tr[0] -= 1.0;
                const s = new PositionState();
                const ref = { position: pos, topRight: tr, bottomLeft: bl, state: s, move };
                if (!this.collidesWithTileBottom(ref)) {
                    position[1] -= offset;
                    bottomLeft[1] -= offset;
                    topRight[1] -= offset;
                    state.pushesBottomTile = true;
                    state.onOneWay = wasOneWay;
                }
            }
        }
        return false;
    }
    /**
     * 
     * @param {{
     * position: vec2,
     * topRight: vec2,
     * bottomLeft: vec2,
     * state: PositionState
     * }} ref
     * @returns {boolean}
     */
    collidesWithTileTop({ position, topRight, bottomLeft, state }) {
        const topRightTile = this.mMap.getMapTileAtPoint(vec2.fromValues(topRight[0] - 0.5, topRight[1] + 0.5));
        const bottomleftTile = this.mMap.getMapTileAtPoint(vec2.fromValues(bottomLeft[0] + 0.5, bottomLeft[1] + 0.5));
        let freeDown = Infinity;
        let slopeX = -1;
        for (let x = bottomleftTile[0]; x <= topRightTile[0]; ++x) {
            const tileCollisionType = this.mMap.getCollisionType(x, topRightTile[1]);
            if (Slopes.isOneWay(tileCollisionType))
                continue;

            switch (tileCollisionType) {
                default://slope
                    const tileCenter = this.mMap.getMapTilePosition(x, topRightTile[1]);
                    const sf = Slopes.getOffset6p(tileCenter, bottomLeft[0] + 0.5, topRight[0] - 0.5, bottomLeft[1] + 0.5, topRight[1] + 0.5, tileCollisionType);
                    sf.freeDown += 1;
                    sf.collidingTop += 1;
                    if (sf.freeDown < freeDown && sf.freeDown <= 0 && sf.freeDown == sf.collidingTop) {
                        freeDown = sf.freeDown;
                        slopeX = x;
                    }

                    break;
                case TileCollisionType.Empty:
                    break;
                case TileCollisionType.Full:
                    state.pushesTopTile = true;
                    vec2.floor(state.topTile, [x, topRightTile[1]]);
                    return true;
            }
        }
        if (slopeX != -1) {
            state.pushesTopTile = true;
            vec2.floor(state.topTile, [slopeX, topRightTile[1]]);
            position[1] += freeDown;
            topRight[1] += freeDown;
            bottomLeft[1] += freeDown;
            return true;
        }

        return false;
    }
    /**
     * 
     * @param {{
     * position: vec2,
     * topRight: vec2,
     * bottomLeft: vec2,
     * state: PositionState
     * }} ref
     * @returns {boolean}
     */
    collidesWithTileBottom({ position, topRight, bottomLeft, state }) {
        const topRightTile = this.mMap.getMapTileAtPoint(vec2.fromValues(topRight[0] - 0.5, topRight[1] - 0.5));
        const bottomleftTile = this.mMap.getMapTileAtPoint(vec2.fromValues(bottomLeft[0] + 0.5, bottomLeft[1] - 0.5));
        let collidingBottom = -Infinity;
        let slopeX = -1;
        let wasOneWay = false;
        let isOneWay;
        for (let x = bottomleftTile[0]; x <= topRightTile[0]; ++x) {
            const tileCollisionType = this.mMap.getCollisionType(x, bottomleftTile[1]);
            isOneWay = Slopes.isOneWay(tileCollisionType);

            if ((this.mIgnoresOneWay || state.tmpIgnoresOneWay) && isOneWay)
                continue;

            switch (tileCollisionType) {
                default://slope

                    const tileCenter = this.mMap.getMapTilePosition(x, bottomleftTile[1]);

                    const sf = Slopes.getOffset6p(tileCenter, bottomLeft[0] + 0.5, topRight[0] - 0.5, bottomLeft[1] - 0.5, topRight[1] - 0.5, tileCollisionType);
                    sf.freeUp -= 1;
                    sf.collidingBottom -= 1;

                    if (((sf.freeUp >= 0 && sf.collidingBottom == sf.freeUp)
                        || (this.mSticksToSlope && state.pushedBottom && sf.freeUp - sf.collidingBottom < cSlopeWallHeight && sf.freeUp >= sf.collidingBottom))
                        && sf.collidingBottom >= collidingBottom
                        && !(isOneWay && Math.abs(sf.collidingBottom) >= cSlopeWallHeight)) {
                        wasOneWay = isOneWay;
                        collidingBottom = sf.collidingBottom;
                        slopeX = x;
                    }

                    break;
                case TileCollisionType.Empty:
                    break;
                case TileCollisionType.Full:
                    state.onOneWay = false;
                    state.pushesBottomTile = true;
                    vec2.floor(state.bottomTile, [x, bottomleftTile[1]]);
                    state.tmpIgnoresOneWay = false;
                    return true;
            }
        }

        if (slopeX != -1) {
            state.onOneWay = wasOneWay;
            state.oneWayY = bottomleftTile[1];
            state.pushesBottomTile = true;
            vec2.floor(state.bottomTile, [slopeX, bottomleftTile[1]]);
            position[1] += collidingBottom;
            topRight[1] += collidingBottom;
            bottomLeft[1] += collidingBottom;
            return true;
        }


        return false;
    }
    /**
     * 
     * @param {{
     * position: vec2,
     * foundObstacleX: boolean,
     * offset: number,
     * step: number,
     * topRight: vec2,
     * bottomLeft: vec2,
     * state: PositionState,
     * move: boolean
     * }} ref
     */
    moveX(ref) {
        while (!ref.foundObstacleX && ref.offset != 0.0) {
            ref.offset -= ref.step;
            if (ref.step > 0.0)
                ref.foundObstacleX = this.collidesWithTileRight(ref);
            else
                ref.foundObstacleX = this.collidesWithTileLeft(ref);
            if (!ref.foundObstacleX) {
                ref.position[0] += ref.step;
                ref.topRight[0] += ref.step;
                ref.bottomLeft[0] += ref.step;
                this.collidesWithTileTop(ref);
                this.collidesWithTileBottom(ref);
            }
        }
    }
    /**
     * 
     * @param {{
     * position: vec2,
     * foundObstacleY: boolean,
     * offset: number,
     * step: number,
     * topRight: vec2,
     * bottomLeft: vec2,
     * state: PositionState,
     * move: boolean
     * }} ref
     */
    moveY(ref) {
        while (!ref.foundObstacleY && ref.offset != 0.0) {
            ref.offset -= ref.step;
            if (ref.step > 0.0)
                ref.foundObstacleY = this.collidesWithTileTop(ref);
            else
                ref.foundObstacleY = this.collidesWithTileBottom(ref);
            if (!ref.foundObstacleY) {
                ref.position[1] += ref.step;
                ref.topRight[1] += ref.step;
                ref.bottomLeft[1] += ref.step;
                this.collidesWithTileLeft(ref);
                this.collidesWithTileRight(ref);
            }
        }
    }
    /**
     * 
     * @param {vec2} offset 
     * @param {vec2} speed 
     * @param {AABB} aabb 
     * @param {{
     * position: vec2,
     * foundObstacleX: boolean,
     * foundObstacleY: boolean,
     * offset: number,
     * step: number,
     * topRight: vec2,
     * bottomLeft: vec2,
     * state: PositionState,
     * remainder: vec2,
     * move: boolean
     * }} ref
     * @returns 
     */
    move(offset, speed, aabb, ref) {
        vec2.add(ref.remainder, ref.remainder, offset);

        vec2.copy(ref.topRight, aabb.max());
        vec2.copy(ref.bottomLeft, aabb.min());

        ref.foundObstacleX = false;
        ref.foundObstacleY = false;
        const step = vec2.fromValues(sign(offset[0]), sign(offset[1]));
        const move = vec2.fromValues(Math.round(ref.remainder[0]), Math.round(ref.remainder[1]));
        vec2.sub(ref.remainder, ref.remainder, move);
        if (move[0] == 0.0 && move[1] == 0.0)
            return;
        else if (move[0] != 0.0 && move[1] == 0.0) {
            ref.offset = move[0];
            ref.step = step[0];
            this.moveX(ref);
            if (step[0] > 0.0)
                ref.state.pushesLeftTile = this.collidesWithTileLeft(ref);
            else
                ref.state.pushesRightTile = this.collidesWithTileRight(ref);

        }
        else if (move[1] != 0.0 && move[0] == 0.0) {

            ref.offset = move[1];
            ref.step = step[1];
            this.moveY(ref);
            if (step[1] > 0.0)
                ref.state.pushesBottomTile = this.collidesWithTileBottom(ref);
            else
                ref.state.pushesTopTile = this.collidesWithTileTop(ref);
            if (!this.mIgnoresOneWay && ref.state.tmpIgnoresOneWay && this.mMap.getMapTileYAtPoint(ref.bottomLeft[1] - 0.5) != ref.state.oneWayY)
                ref.state.tmpIgnoresOneWay = false;
        }
        else {
            const speedRatio = Math.abs(speed[1]) / Math.abs(speed[0]);
            let vertAccum = 0.0;
            while (!ref.foundObstacleX && !ref.foundObstacleY && (move[0] != 0.0 || move[1] != 0.0)) {
                vertAccum += sign(step[1]) * speedRatio;
                ref.offset = step[0];
                ref.step = step[0];
                this.moveX(ref);
                move[0] -= step[0];
                while (!ref.foundObstacleY && move[1] != 0.0 && (Math.abs(vertAccum) >= 1.0 || move[0] == 0.0)) {
                    move[1] -= step[1];
                    vertAccum -= step[1];
                    ref.offset = step[1];
                    ref.step = step[1];
                    this.moveY(ref);
                }
            }
            if (step[0] > 0.0)
                ref.state.pushesLeftTile = this.collidesWithTileLeft(ref);
            else
                ref.state.pushesRightTile = this.collidesWithTileRight(ref);
            if (step[1] > 0.0)
                ref.state.pushesBottomTile = this.collidesWithTileBottom(ref);
            else
                ref.state.pushesTopTile = this.collidesWithTileTop(ref);
            if (!this.mIgnoresOneWay && ref.state.tmpIgnoresOneWay && this.mMap.getMapTileYAtPoint(ref.bottomLeft[1] - 0.5) != ref.state.oneWayY)
                ref.state.tmpIgnoresOneWay = false;
        }
    }
    updatePhysicsResponse() {
        if (this.mIsKinematic)
            return;

        this.mPS.pushedBottomObject = this.mPS.pushesBottomObject;
        this.mPS.pushedRightObject = this.mPS.pushesRightObject;
        this.mPS.pushedLeftObject = this.mPS.pushesLeftObject;
        this.mPS.pushedTopObject = this.mPS.pushesTopObject;

        this.mPS.pushesBottomObject = false;
        this.mPS.pushesRightObject = false;
        this.mPS.pushesLeftObject = false;
        this.mPS.pushesTopObject = false;

        const offsetSum = vec2.create();
        for (let i = 0; i < this.mAllCollidingObjects.length; ++i) {
            const other = this.mAllCollidingObjects[i].other;
            const data = this.mAllCollidingObjects[i];
            const overlap = vec2.sub(vec2.create(), data.overlap, offsetSum);
            if (overlap[0] === 0.0) {
                if (other.mAABB.center[0] > this.mAABB.center[0]) {
                    this.mPS.pushesRightObject = true;
                    this.mSpeed[0] = Math.min(this.mSpeed[0], 0.0);
                }
                else {
                    this.mPS.pushesLeftObject = true;
                    this.mSpeed[0] = Math.max(this.mSpeed[0], 0.0);
                }
                continue;
            } else if (overlap[1] === 0.0) {
                if (other.mAABB.center[1] > this.mAABB.center[1]) {
                    this.mPS.pushesTopObject = true;
                    this.mSpeed[1] = Math.min(this.mSpeed[1], 0.0);
                }
                else {
                    this.mPS.pushesBottomObject = true;
                    this.mSpeed[1] = Math.max(this.mSpeed[1], 0.0);
                }
                continue;
            }


            const absSpeed1 = [Math.abs(data.pos1[0] - data.oldPos1[0]), Math.abs(data.pos1[1] - data.oldPos1[1])];
            const absSpeed2 = [Math.abs(data.pos2[0] - data.oldPos2[0]), Math.abs(data.pos2[1] - data.oldPos2[1])];
            const speedSum = vec2.add(vec2.create(), absSpeed1, absSpeed2);
            let speedRatioX, speedRatioY;
            if (other.mIsKinematic)
                speedRatioX = speedRatioY = 1.0;
            else {
                if (speedSum[0] === 0.0 && speedSum[1] === 0.0) {
                    speedRatioX = speedRatioY = 0.5;
                } else if (speedSum[0] === 0.0) {
                    speedRatioX = 0.5;
                    speedRatioY = absSpeed1[1] / speedSum[1];
                } else if (speedSum[1] === 0.0) {
                    speedRatioX = absSpeed1[0] / speedSum[0];
                    speedRatioY = 0.5;
                } else {
                    speedRatioX = absSpeed1[0] / speedSum[0];
                    speedRatioY = absSpeed1[1] / speedSum[1];
                }
            }
            const offsetX = overlap[0] * speedRatioX;
            const offsetY = overlap[1] * speedRatioY;

            const overlappedLastFrameX = Math.abs(data.oldPos1[0] - data.oldPos2[0]) < this.mAABB.halfSize[0] + other.mAABB.halfSize[0];
            const overlappedLastFrameY = Math.abs(data.oldPos1[1] - data.oldPos2[1]) < this.mAABB.halfSize[1] + other.mAABB.halfSize[1];


            if ((!overlappedLastFrameX && overlappedLastFrameY)
                || (!overlappedLastFrameX && !overlappedLastFrameY && Math.abs(overlap[0]) <= Math.abs(overlap[1]))) {
                this.mPosition[0] += offsetX;
                offsetSum[0] += offsetX;
                if (overlap[0] < 0.0) {
                    this.mPS.pushesRightObject = true;
                    this.mSpeed[0] = Math.min(this.mSpeed[0], 0.0);
                }
                else {
                    this.mPS.pushesLeftObject = true;
                    this.mSpeed[0] = Math.max(this.mSpeed[0], 0.0);
                }
            }
            else {
                this.mPosition[1] += offsetY;
                offsetSum[1] += offsetY;
                if (overlap[1] < 0.0) {
                    this.mPS.pushesTopObject = true;
                    this.mSpeed[1] = Math.min(this.mSpeed[1], 0.0);
                }
                else {
                    this.mPS.pushesBottomObject = true;
                    this.mSpeed[1] = Math.max(this.mSpeed[1], 0.0);
                }
            }
        }


    }
    updatePhysicsP2() {
        this.updatePhysicsResponse();
        this.mPS.pushesBottom = this.mPS.pushesBottomTile || this.mPS.pushesBottomObject;
        this.mPS.pushesRight = this.mPS.pushesRightTile || this.mPS.pushesRightObject;
        this.mPS.pushesLeft = this.mPS.pushesLeftTile || this.mPS.pushesLeftObject;
        this.mPS.pushesTop = this.mPS.pushesTopTile || this.mPS.pushesTopObject;
        //update the aabb 
        vec2.add(this.mAABB.center, this.mPosition, this.aabbOffset);
    }
    updatePhysics() {
        this.mPS.pushedBottom = this.mPS.pushesBottom;
        this.mPS.pushedRight = this.mPS.pushesRight;
        this.mPS.pushedLeft = this.mPS.pushesLeft;
        this.mPS.pushedTop = this.mPS.pushesTop;
        this.mPS.pushedBottomTile = this.mPS.pushesBottomTile;
        this.mPS.pushedLeftTile = this.mPS.pushesLeftTile;
        this.mPS.pushedRightTile = this.mPS.pushesRightTile;
        this.mPS.pushedTopTile = this.mPS.pushesTopTile;
        this.mPS.pushesBottom = this.mPS.pushesLeft = this.mPS.pushesRight = this.mPS.pushesTop =
            this.mPS.pushesBottomTile = this.mPS.pushesLeftTile = this.mPS.pushesRightTile = this.mPS.pushesTopTile =
            this.mPS.pushesBottomObject = this.mPS.pushesLeftObject = this.mPS.pushesRightObject = this.mPS.pushesTopObject = this.mPS.onOneWayPlatform = false;

        const ref = {
            position: this.mPosition,
            topRight: this.mAABB.max(),
            bottomLeft: this.mAABB.min(),
            state: this.mPS,
            move: false,
            remainder: this.mRemainder,
            aabb: this.mAABB,
            foundObstacleX: false,
            foundObstacleY: false,
            offset: 0,
            step: 0
        }
        this.collidesWithTiles(ref);
        this.mOldSpeed = this.mSpeed;
        if (this.mPS.pushesBottomTile)
            this.mSpeed[1] = Math.max(0.0, this.mSpeed[1]);
        if (this.mPS.pushesTopTile)
            this.mSpeed[1] = Math.min(0.0, this.mSpeed[1]);
        if (this.mPS.pushesLeftTile)
            this.mSpeed[0] = Math.max(0.0, this.mSpeed[0]);
        if (this.mPS.pushesRightTile)
            this.mSpeed[0] = Math.min(0.0, this.mSpeed[0]);
        vec2.copy(this.mOldPosition, this.mPosition);
        const newPosition = vec2.add(vec2.create(), this.mPosition, vec2.scale(vec2.create(), this.mSpeed, this.deltaTime));
        const offset = vec2.sub(vec2.create(), newPosition, this.mPosition);
        if (offset[0] != 0.0 || offset[1] != 0.0) {
            this.move(offset, this.mSpeed, this.mAABB, ref);
        }
        vec2.copy(this.mAABB.center, this.mPosition);
        this.mPS.pushesBottom = this.mPS.pushesBottomTile;
        this.mPS.pushesRight = this.mPS.pushesRightTile;
        this.mPS.pushesLeft = this.mPS.pushesLeftTile;
        this.mPS.pushesTop = this.mPS.pushesTopTile;
    }
    /**
     * 
     * @param {{
     * position: vec2,
     * topRight: vec2,
     * bottomLeft: vec2,
     * state: PositionState
     * move: boolean
     * }} ref
     */
    collidesWithTiles(ref) {
        this.collidesWithTileTop(ref);
        this.collidesWithTileBottom(ref);
        this.collidesWithTileLeft(ref);
        this.collidesWithTileRight(ref);
    }
    /**
     * 
     * @param {MovingObject} other 
     * @returns {boolean}
     */
    hasCollisionDataFor(other) {
        for (let i = 0; i < this.mAllCollidingObjects.length; ++i) {
            if (this.mAllCollidingObjects[i].other === other) {
                return true;
            }
        }
        return false;
    }
    /**
     * 
     * @param {vec2} oldPosition 
     * @param {vec2} position 
     * @param {vec2} speed 
     * @param {{groundY: number, onOneWayPlatform: boolean}} out 
     * @returns {boolean}
     */
    hasGround(oldPosition, position, speed, out) {
        const oldCenter = vec2.create();
        vec2.add(oldCenter, oldPosition, this.aabbOffset);
        const center = vec2.create();
        vec2.add(center, position, this.aabbOffset);
        const oldBottomLeft = vec2.create();
        vec2.sub(oldBottomLeft, oldCenter, this.mAABB.halfSize);
        vec2.sub(oldBottomLeft, oldBottomLeft, vec2.fromValues(0.0, 1.0));
        vec2.add(oldBottomLeft, oldBottomLeft, vec2.fromValues(1.0, 0.0));
        vec2.round(oldBottomLeft, oldBottomLeft);
        const newBottomLeft = vec2.create();
        vec2.sub(newBottomLeft, center, this.mAABB.halfSize);
        vec2.sub(newBottomLeft, newBottomLeft, vec2.fromValues(0.0, 1.0));
        vec2.add(newBottomLeft, newBottomLeft, vec2.fromValues(1.0, 0.0));
        vec2.round(newBottomLeft, newBottomLeft);
        const newBottomRight = vec2.create();
        newBottomRight[0] = newBottomLeft[0] + this.mAABB.halfSize[0] * 2.0 - 2.0;
        newBottomRight[1] = newBottomLeft[1];
        vec2.round(newBottomRight, newBottomRight);
        const endY = this.mMap.getMapTileYAtPoint(newBottomLeft[1]);
        const begY = Math.max(this.mMap.getMapTileYAtPoint(oldBottomLeft[1]) - 1, endY);
        const dist = Math.max(Math.abs(endY - begY), 1);
        let tileIndexX;
        for (let tileIndexY = begY; tileIndexY >= endY; --tileIndexY) {
            const bottomLeft = lerpVec2(newBottomLeft, oldBottomLeft, Math.abs(endY - tileIndexY) / dist);
            const bottomRight = vec2.fromValues(bottomLeft[0] + this.mAABB.halfSize[0] * 2.0 - 2.0, bottomLeft[1]);
            const checkedTile = vec2.create();
            vec2.copy(checkedTile, bottomLeft);
            for (; ; checkedTile[0] += cTileSize) {
                checkedTile[0] = Math.min(checkedTile[0], bottomRight[0]);

                tileIndexX = this.mMap.getMapTileXAtPoint(checkedTile[0]);

                out.groundY = tileIndexY * cTileSize + cTileSize / 2.0 + this.mMap.mPosition[1];
                if (this.mMap.isObstacle(tileIndexX, tileIndexY)) {
                    out.onOneWayPlatform = false;
                    return true;
                } else if (this.mMap.isOneWayPlatform(tileIndexX, tileIndexY)
                    && Math.abs(checkedTile[1] - out.groundY) <= cOneWayPlatformThreshold + oldPosition[1] - position[1]) {
                    out.onOneWayPlatform = true;
                }
                if (checkedTile[0] >= bottomRight[0]) {
                    if (out.onOneWayPlatform) {
                        return true;
                    }
                    break;
                }
            }
        }
        return false;
    }
    /**
     * 
     * @param {vec2} oldPosition 
     * @param {vec2} position 
     * @param {{ceilingY: number}} out 
     * @returns {boolean}
     */
    hasCeiling(oldPosition, position, out) {
        const center = vec2.add(vec2.create(), position, this.aabbOffset);
        const oldCenter = vec2.add(vec2.create(), oldPosition, this.aabbOffset);
        out.ceilingY = 0.0;
        const oldTopRight = vec2.add(vec2.create(), oldCenter, this.mAABB.halfSize);
        vec2.add(oldTopRight, oldTopRight, vec2.fromValues(0.0, 1.0));
        vec2.sub(oldTopRight, oldTopRight, vec2.fromValues(1.0, 0.0));
        vec2.round(oldTopRight, oldTopRight);
        const newTopRight = vec2.add(vec2.create(), center, this.mAABB.halfSize);
        vec2.add(newTopRight, newTopRight, vec2.fromValues(0.0, 1.0));
        vec2.sub(newTopRight, newTopRight, vec2.fromValues(1.0, 0.0));
        vec2.round(newTopRight, newTopRight);
        const newTopLeft = vec2.create();
        newTopLeft[0] = newTopRight[0] - this.mAABB.halfSize[0] * 2.0 + 2.0;
        newTopLeft[1] = newTopRight[1];
        vec2.round(newTopLeft, newTopLeft);
        const endY = this.mMap.getMapTileYAtPoint(newTopRight[1]);
        const begY = Math.min(this.mMap.getMapTileYAtPoint(oldTopRight[1]) + 1, endY);
        const dist = Math.max(Math.abs(endY - begY), 1);
        let tileIndexX;
        for (let tileIndexY = begY; tileIndexY <= endY; ++tileIndexY) {
            const topRight = lerpVec2(newTopRight, oldTopRight, Math.abs(endY - tileIndexY) / dist);
            const topLeft = vec2.fromValues(topRight[0] - this.mAABB.halfSize[0] * 2.0 + 2.0, topRight[1]);
            const checkedTile = vec2.create();
            vec2.copy(checkedTile, topLeft);
            for (; ; checkedTile[0] += cTileSize) {
                checkedTile[0] = Math.min(checkedTile[0], topRight[0]);
                tileIndexX = this.mMap.getMapTileXAtPoint(checkedTile[0]);
                if (this.mMap.isObstacle(tileIndexX, tileIndexY)) {
                    out.ceilingY = tileIndexY * cTileSize - cTileSize / 2.0 + this.mMap.mPosition[1];
                    return true;
                }
                if (checkedTile[0] >= topRight[0]) {
                    break;
                }
            }
        }
        return false;
    }

    /**
     * 
     * @param {vec2} oldPosition 
     * @param {vec2} position 
     * @param {{wallX: number}} out 
     * @returns {boolean}
     */
    collidesWithLeftWall(oldPosition, position, out) {
        const center = vec2.add(vec2.create(), position, this.aabbOffset);
        const oldCenter = vec2.add(vec2.create(), oldPosition, this.aabbOffset);
        out.wallX = 0.0;
        const oldBottomLeft = vec2.sub(vec2.create(), oldCenter, this.mAABB.halfSize);
        vec2.sub(oldBottomLeft, oldBottomLeft, vec2.fromValues(1.0, 0.0));
        vec2.round(oldBottomLeft, oldBottomLeft);
        const newBottomLeft = vec2.sub(vec2.create(), center, this.mAABB.halfSize);
        vec2.sub(newBottomLeft, newBottomLeft, vec2.fromValues(1.0, 0.0));
        vec2.round(newBottomLeft, newBottomLeft);
        const newTopLeft = vec2.add(vec2.create(), newBottomLeft, vec2.fromValues(0.0, this.mAABB.halfSize[1] * 2.0));
        vec2.round(newTopLeft, newTopLeft);
        const endX = this.mMap.getMapTileXAtPoint(newBottomLeft[0]);
        const begX = Math.max(this.mMap.getMapTileXAtPoint(oldBottomLeft[0]) - 1, endX);
        const dist = Math.max(Math.abs(endX - begX), 1);
        let tileIndexY;
        for (let tileIndexX = begX; tileIndexX >= endX; --tileIndexX) {
            const bottomLeft = lerpVec2(newBottomLeft, oldBottomLeft, Math.abs(endX - tileIndexX) / dist);
            const topLeft = vec2.add(vec2.create(), bottomLeft, vec2.fromValues(0.0, this.mAABB.halfSize[1] * 2.0));
            const checkedTile = vec2.create();
            vec2.copy(checkedTile, bottomLeft);
            for (; ; checkedTile[1] += cTileSize) {
                checkedTile[1] = Math.min(checkedTile[1], topLeft[1]);
                tileIndexY = this.mMap.getMapTileYAtPoint(checkedTile[1]);
                if (this.mMap.isObstacle(tileIndexX, tileIndexY)) {
                    out.wallX = tileIndexX * cTileSize + cTileSize / 2.0 + this.mMap.mPosition[0];
                    return true;
                }
                if (checkedTile[1] >= topLeft[1]) {
                    break;
                }
            }
        }
        return false;
    }

    /**
     * 
     * @param {vec2} oldPosition 
     * @param {vec2} position 
     * @param {{wallX: number}} out 
     * @returns {boolean}
     */

    collidesWithRightWall(oldPosition, position, out) {
        const center = vec2.add(vec2.create(), position, this.aabbOffset);
        const oldCenter = vec2.add(vec2.create(), oldPosition, this.aabbOffset);
        out.wallX = 0.0;
        const oldBottomRight = vec2.add(vec2.create(), oldCenter, [this.mAABB.halfSize[0], -this.mAABB.halfSize[1]]);
        vec2.add(oldBottomRight, oldBottomRight, vec2.fromValues(1.0, 0.0));
        vec2.round(oldBottomRight, oldBottomRight);
        const newBottomRight = vec2.add(vec2.create(), center, [this.mAABB.halfSize[0], -this.mAABB.halfSize[1]]);
        vec2.add(newBottomRight, newBottomRight, vec2.fromValues(1.0, 0.0));
        vec2.round(newBottomRight, newBottomRight);
        const newTopRight = vec2.add(vec2.create(), newBottomRight, vec2.fromValues(0.0, this.mAABB.halfSize[1] * 2.0));
        vec2.round(newTopRight, newTopRight);
        const endX = this.mMap.getMapTileXAtPoint(newBottomRight[0]);
        const begX = Math.min(this.mMap.getMapTileXAtPoint(oldBottomRight[0]) + 1, endX);
        const dist = Math.max(Math.abs(endX - begX), 1);
        let tileIndexY;
        for (let tileIndexX = begX; tileIndexX <= endX; ++tileIndexX) {
            const bottomRight = lerpVec2(newBottomRight, oldBottomRight, Math.abs(endX - tileIndexX) / dist);
            const topRight = vec2.add(vec2.create(), bottomRight, vec2.fromValues(0.0, this.mAABB.halfSize[1] * 2.0));
            const checkedTile = vec2.create();
            vec2.copy(checkedTile, bottomRight);
            for (; ; checkedTile[1] += cTileSize) {
                checkedTile[1] = Math.min(checkedTile[1], topRight[1]);
                tileIndexY = this.mMap.getMapTileYAtPoint(checkedTile[1]);
                if (this.mMap.isObstacle(tileIndexX, tileIndexY)) {
                    out.wallX = tileIndexX * cTileSize - cTileSize / 2.0 + this.mMap.mPosition[0];
                    return true;
                }
                if (checkedTile[1] >= topRight[1]) {
                    break;
                }
            }
        }
        return false;
    }

}
/**
 * 
 * @param {vec2} a 
 * @param {vec2} b 
 * @param {number} t 
 * @returns {vec2}
 */
function lerpVec2(a, b, t) {
    return vec2.fromValues(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t);
}