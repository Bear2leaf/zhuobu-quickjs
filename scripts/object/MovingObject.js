import { SpriteRenderer } from "../component/SpriteRenderer.js";
import { getScreenHeight, vec2, vec3 } from "../libs.js";
import { cTileSize } from "../misc/constants.js";
import { ObjectType, TileCollisionType } from "../misc/enums.js";
import { clamp, sign } from "../misc/math.js";
import { AABB } from "./AABB.js";
import { CollisionData } from "./CollisionData.js";
import { Map } from "./Map.js";
import { PositionState } from "./PositionState.js";
import { Slopes } from "./Slopes.js";

export class MovingObject {
    get position() {
        return vec2.lerp(vec2.create(), this.mPositionRenderPrev, this.mPositionRender, this.mAlpha);
    }
    get scale() {
        return vec2.fromValues(this.mScale[0], this.mScale[1]);
    }
    set scale(value) {
        this.mScale = vec2.fromValues(value[0], value[1]);
        this.mAABB.scale = [Math.abs(this.mScale[0]), Math.abs(this.mScale[1])];
    }
    tickPosition() {
        vec2.copy(this.mPositionRenderPrev, this.mPositionRender);
        vec2.set(this.mPositionRender, this.mPosition[0] + (this.mOffset[0] === 0 ? 0 : this.mRemainder[0]), this.mPosition[1] + (this.mOffset[1] === 0 ? 0 : this.mRemainder[1]));
    }
    /** @param {Map} map */
    constructor(map) {
        this.mAlpha = 0;
        this.mPositionRender = vec2.create();
        this.mPositionRenderPrev = vec2.create();
        this.mOldPosition = vec2.create();
        this.mPosition = vec2.create();
        this.mRemainder = vec2.create();
        this.mPS = new PositionState();
        this.mOldSpeed = vec2.create();
        this.mSpeed = vec2.create();

        this.mScale = vec2.fromValues(1, 1);
        this.mAABB = new AABB();

        this.mSpriteRenderer = new SpriteRenderer();;

        this.deltaTime = 0;
        this.mMap = map;
        /** @type {vec2[]} */
        this.mAreas = [];
        /** @type {number[]} */
        this.mIdsInAreas = [];
        /** @type {EnumValue<typeof ObjectType>} */
        this.mType = ObjectType.None;

        /** @type {CollisionData[]} */
        this.mAllCollidingObjects = [];



        this.mIgnoresOneWay = false;
        this.mOnOneWayPlatform = false;
        this.mIsKinematic = false;

        this.mSlopeWallHeight = 0;
        /** @type {MovingObject | null} */
        this.mMountParent = null;

        this.mOffset = vec2.create();

    }
    init() {
        throw new Error("Method not implemented.");
    }
    customUpdate() {
        throw new Error("Method not implemented.");
    }
    /**
     * 
     * @param {{
     * position: vec2,
     * topRight: vec2,
     * bottomLeft: vec2,
     * state: PositionState,
     * }} ref
     * @returns {boolean}
     */
    collidesWithTileLeft(ref, move = false) {
        const topRightTile = this.mMap.getMapTileAtPoint([ref.topRight[0] - 0.5, ref.topRight[1] - 0.5]);
        vec2.floor(topRightTile, topRightTile);
        const bottomLeftTile = this.mMap.getMapTileAtPoint([ref.bottomLeft[0] - 0.5, ref.bottomLeft[1] + 0.5]);
        vec2.floor(bottomLeftTile, bottomLeftTile);
        let slopeOffset = 0.0, oldSlopeOffset = 0.0;
        let wasOneWay = false, isOneWay;
        /** @type {EnumValue<TileCollisionType>} */
        let slopeCollisionType = TileCollisionType.Empty;
        for (let y = bottomLeftTile[1]; y <= topRightTile[1]; ++y) {
            const tileCollisionType = this.mMap.getCollisionType(bottomLeftTile[0], y);

            isOneWay = Slopes.isOneWay(tileCollisionType);

            if (isOneWay && (!move || this.mIgnoresOneWay || ref.state.tmpIgnoresOneWay || y != bottomLeftTile[1]))
                continue;
            switch (tileCollisionType) {
                default://slope 
                    const tileCenter = this.mMap.getMapTilePosition(bottomLeftTile[0], y);
                    const leftTileEdge = (tileCenter[0] - cTileSize / 2);
                    const rightTileEdge = (leftTileEdge + cTileSize);
                    const bottomTileEdge = (tileCenter[1] - cTileSize / 2);
                    oldSlopeOffset = slopeOffset;
                    const offset = Slopes.getOffset6p(tileCenter, ref.bottomLeft[0] - 0.5, ref.topRight[0] - 0.5, ref.bottomLeft[1] + 0.5, ref.topRight[1] - 0.5, tileCollisionType);
                    slopeOffset = Math.abs(offset.freeUp) < Math.abs(offset.freeDown) ? offset.freeUp : offset.freeDown;
                    if (!isOneWay && (Math.abs(slopeOffset) >= this.mSlopeWallHeight || (slopeOffset < 0 && ref.state.pushesBottomTile) || (slopeOffset > 0 && ref.state.pushesTopTile))) {
                        ref.state.pushesLeftTile = true;
                        vec2.floor(ref.state.leftTile, [bottomLeftTile[0], y]);
                        return true;
                    }
                    else if (Math.abs(slopeOffset) > Math.abs(oldSlopeOffset)) {
                        wasOneWay = isOneWay;
                        slopeCollisionType = tileCollisionType;
                        vec2.floor(ref.state.leftTile, [bottomLeftTile[0], y]);
                    }
                    else
                        slopeOffset = oldSlopeOffset;
                    break;
                case TileCollisionType.Empty:
                    break;
            }
        }
        if (slopeCollisionType != TileCollisionType.Empty && slopeOffset != 0) {
            if (slopeOffset > 0 && slopeOffset < this.mSlopeWallHeight) {
                const pos = vec2.clone(ref.position);
                const tr = vec2.clone(ref.topRight);
                const bl = vec2.clone(ref.bottomLeft);
                pos[1] += slopeOffset - sign(slopeOffset);
                tr[1] += slopeOffset - sign(slopeOffset);
                bl[1] += slopeOffset - sign(slopeOffset);
                const s = new PositionState();
                const newRef = { position: pos, topRight: tr, bottomLeft: bl, state: s }
                if (this.collidesWithTileTop(newRef)) {
                    ref.state.pushesLeftTile = true;
                    return true;
                }
                else if (move) {
                    ref.position[1] += slopeOffset;
                    ref.bottomLeft[1] += slopeOffset;
                    ref.topRight[1] += slopeOffset;
                    ref.state.pushesBottomTile = true;
                    ref.state.onOneWay = wasOneWay;
                }
            }
            else if (slopeOffset < 0) {
                ref.state.pushesLeftTile = true;
                return true;
            }
        }
        if (ref.state.tmpSticksToSlope && ref.state.pushedBottomTile && move) {
            const nextX = this.mMap.getMapTileXAtPoint(ref.topRight[0] - 1.5);
            const bottomY = this.mMap.getMapTileYAtPoint(ref.bottomLeft[1] + 1.0) - 1;

            const prevPos = this.mMap.getMapTilePosition(topRightTile[0], bottomLeftTile[1]);
            const nextPos = this.mMap.getMapTilePosition(nextX, bottomY);

            const prevCollisionType = this.mMap.getCollisionType(topRightTile[0], bottomLeftTile[1]);
            const nextCollisionType = this.mMap.getCollisionType(nextX, bottomY);

            const x1 = Math.floor(clamp((ref.topRight[0] - 1.0 - (prevPos[0] - cTileSize / 2)), 0.0, cTileSize - 1));
            const x2 = Math.floor(clamp((ref.topRight[0] - 1.5 - (nextPos[0] - cTileSize / 2)), 0.0, cTileSize - 1));

            const slopeHeight = Slopes.getSlopeHeightFromBottom(x1, prevCollisionType);
            const nextSlopeHeight = Slopes.getSlopeHeightFromBottom(x2, nextCollisionType);

            const offset = slopeHeight + cTileSize - nextSlopeHeight;

            if (offset < this.mSlopeWallHeight && offset > 0) {
                const pos = vec2.clone(ref.position);
                const tr = vec2.clone(ref.topRight);
                const bl = vec2.clone(ref.bottomLeft);
                pos[1] -= offset - sign(offset);
                tr[1] -= offset - sign(offset);
                bl[1] -= offset - sign(offset);
                bl[0] -= 1.0;
                tr[0] -= 1.0;
                const s = new PositionState();
                const newRef = { position: pos, topRight: tr, bottomLeft: bl, state: s }
                if (!this.collidesWithTileBottom(newRef)) {
                    ref.position[1] -= offset;
                    ref.bottomLeft[1] -= offset;
                    ref.topRight[1] -= offset;
                    ref.state.pushesBottomTile = true;
                    ref.state.onOneWay = wasOneWay;
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
     * }} ref
     * @returns {boolean}
     */
    collidesWithTileRight(ref, move = false) {
        const topRightTile = this.mMap.getMapTileAtPoint(vec2.fromValues(ref.topRight[0] + 0.5, ref.topRight[1] - 0.5));
        vec2.floor(topRightTile, topRightTile);
        const bottomLeftTile = this.mMap.getMapTileAtPoint(vec2.fromValues(ref.bottomLeft[0] + 0.5, ref.bottomLeft[1] + 0.5));
        vec2.floor(bottomLeftTile, bottomLeftTile);
        let slopeOffset = 0.0;
        let oldSlopeOffset = 0.0;
        let wasOneWay = false, isOneWay;

        /** @type {EnumValue<TileCollisionType>} */
        let slopeCollisionType = TileCollisionType.Empty;
        for (let y = bottomLeftTile[1]; y <= topRightTile[1]; ++y) {
            const tileCollisionType = this.mMap.getCollisionType(topRightTile[0], y);
            isOneWay = Slopes.isOneWay(tileCollisionType);
            if (isOneWay && (!move || this.mIgnoresOneWay || ref.state.tmpIgnoresOneWay || y != bottomLeftTile[1]))
                continue;


            switch (tileCollisionType) {
                default://slope 
                    const tileCenter = this.mMap.getMapTilePosition(topRightTile[0], y);
                    const leftTileEdge = (tileCenter[0] - cTileSize / 2);
                    const rightTileEdge = (leftTileEdge + cTileSize);
                    const bottomTileEdge = (tileCenter[1] - cTileSize / 2);


                    oldSlopeOffset = slopeOffset;

                    const offset = Slopes.getOffset6p(tileCenter, ref.bottomLeft[0] + 0.5, ref.topRight[0] + 0.5, ref.bottomLeft[1] + 0.5, ref.topRight[1] - 0.5, tileCollisionType);
                    slopeOffset = Math.abs(offset.freeUp) < Math.abs(offset.freeDown) ? offset.freeUp : offset.freeDown;
                    if (!isOneWay && (Math.abs(slopeOffset) >= this.mSlopeWallHeight || (slopeOffset < 0 && ref.state.pushesBottomTile) || (slopeOffset > 0 && ref.state.pushesTopTile))) {
                        ref.state.pushesRightTile = true;
                        vec2.floor(ref.state.rightTile, [topRightTile[0], y]);
                        return true;
                    }
                    else if (Math.abs(slopeOffset) > Math.abs(oldSlopeOffset)) {
                        wasOneWay = isOneWay;
                        slopeCollisionType = tileCollisionType;
                        vec2.floor(ref.state.rightTile, [topRightTile[0], y]);
                    }
                    else
                        slopeOffset = oldSlopeOffset;
                    break;
                case TileCollisionType.Empty:
                    break;
            }
        }
        if (slopeCollisionType != TileCollisionType.Empty && slopeOffset != 0.0) {
            if (slopeOffset > 0 && slopeOffset < this.mSlopeWallHeight) {
                const pos = vec2.clone(ref.position);
                const tr = vec2.clone(ref.topRight);
                const bl = vec2.clone(ref.bottomLeft);
                pos[1] += slopeOffset - sign(slopeOffset);
                tr[1] += slopeOffset - sign(slopeOffset);
                bl[1] += slopeOffset - sign(slopeOffset);
                const s = new PositionState();
                const newRef = { position: pos, topRight: tr, bottomLeft: bl, state: s }
                if (this.collidesWithTileTop(newRef)) {
                    ref.state.pushesRightTile = true;
                    return true;
                } else if (move) {
                    ref.position[1] += slopeOffset;
                    ref.bottomLeft[1] += slopeOffset;
                    ref.topRight[1] += slopeOffset;
                    ref.state.pushesBottomTile = true;
                    ref.state.onOneWay = wasOneWay;
                }
            }
            else if (slopeOffset < 0) {
                ref.state.pushedRightTile = true;
                return true;
            }
        }
        if (ref.state.tmpSticksToSlope && ref.state.pushedBottomTile && move) {
            const nextX = this.mMap.getMapTileXAtPoint(ref.bottomLeft[0] + 1.0);
            const bottomY = this.mMap.getMapTileYAtPoint(ref.bottomLeft[1] + 1.0) - 1;

            const prevPos = this.mMap.getMapTilePosition(bottomLeftTile[0], bottomLeftTile[1]);
            const nextPos = this.mMap.getMapTilePosition(nextX, bottomY);
            const prevCollisionType = this.mMap.getCollisionType(bottomLeftTile[0], bottomLeftTile[1]);
            const nextCollisionType = this.mMap.getCollisionType(nextX, bottomY);

            const x1 = Math.floor(clamp((ref.bottomLeft[0] - (prevPos[0] - cTileSize / 2)), 0.0, cTileSize - 1));
            const x2 = Math.floor(clamp((ref.bottomLeft[0] + 1.0 - (nextPos[0] - cTileSize / 2)), 0.0, cTileSize - 1));

            const slopeHeight = Slopes.getSlopeHeightFromBottom(x1, prevCollisionType);
            const nextSlopeHeight = Slopes.getSlopeHeightFromBottom(x2, nextCollisionType);

            const offset = slopeHeight + cTileSize - nextSlopeHeight;

            if (offset < this.mSlopeWallHeight && offset > 0) {
                const pos = vec2.clone(ref.position);
                const tr = vec2.clone(ref.topRight);
                const bl = vec2.clone(ref.bottomLeft);
                pos[1] -= offset - sign(offset);
                tr[1] -= offset - sign(offset);
                bl[1] -= offset - sign(offset);
                bl[0] += 1.0;
                tr[0] += 1.0;
                const s = new PositionState();
                const newRef = { position: pos, topRight: tr, bottomLeft: bl, state: s }
                if (!this.collidesWithTileBottom(newRef)) {
                    ref.position[1] -= offset;
                    ref.bottomLeft[1] -= offset;
                    ref.topRight[1] -= offset;
                    ref.state.pushesBottomTile = true;
                    ref.state.onOneWay = wasOneWay;
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
    collidesWithTileTop(ref) {
        const topRightTile = this.mMap.getMapTileAtPoint(vec2.fromValues(ref.topRight[0] - 0.5, ref.topRight[1] + 0.5));
        const bottomleftTile = this.mMap.getMapTileAtPoint(vec2.fromValues(ref.bottomLeft[0] + 0.5, ref.bottomLeft[1] + 0.5));
        let freeDown = Infinity;
        let slopeX = -1;
        for (let x = bottomleftTile[0]; x <= topRightTile[0]; ++x) {
            const tileCollisionType = this.mMap.getCollisionType(x, topRightTile[1]);
            if (Slopes.isOneWay(tileCollisionType))
                continue;

            switch (tileCollisionType) {
                default://slope
                    const tileCenter = this.mMap.getMapTilePosition(x, topRightTile[1]);
                    const sf = Slopes.getOffset6p(tileCenter, ref.bottomLeft[0] + 0.5, ref.topRight[0] - 0.5, ref.bottomLeft[1] + 0.5, ref.topRight[1] + 0.5, tileCollisionType);
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
                    ref.state.pushesTopTile = true;
                    vec2.floor(ref.state.topTile, [x, topRightTile[1]]);
                    return true;
            }
        }
        if (slopeX != -1) {
            ref.state.pushesTopTile = true;
            vec2.floor(ref.state.topTile, [slopeX, topRightTile[1]]);
            ref.position[1] += freeDown;
            ref.topRight[1] += freeDown;
            ref.bottomLeft[1] += freeDown;
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
    collidesWithTileBottom(ref) {
        const topRightTile = this.mMap.getMapTileAtPoint(vec2.fromValues(ref.topRight[0] - 0.5, ref.topRight[1] - 0.5));
        const bottomleftTile = this.mMap.getMapTileAtPoint(vec2.fromValues(ref.bottomLeft[0] + 0.5, ref.bottomLeft[1] - 0.5));
        let collidingBottom = -Infinity;
        let slopeX = -1;
        let wasOneWay = false;
        let isOneWay;
        for (let x = bottomleftTile[0]; x <= topRightTile[0]; ++x) {

            const tileCollisionType = this.mMap.getCollisionType(x, bottomleftTile[1]);


            isOneWay = Slopes.isOneWay(tileCollisionType);
            if ((this.mIgnoresOneWay || ref.state.tmpIgnoresOneWay) && isOneWay)
                continue;

            switch (tileCollisionType) {
                default://slope

                    const tileCenter = this.mMap.getMapTilePosition(x, bottomleftTile[1]);

                    const sf = Slopes.getOffset6p(tileCenter, ref.bottomLeft[0] + 0.5, ref.topRight[0] - 0.5, ref.bottomLeft[1] - 0.5, ref.topRight[1] - 0.5, tileCollisionType);
                    sf.freeUp -= 1;
                    sf.collidingBottom -= 1;

                    if (((sf.freeUp >= 0 && sf.collidingBottom == sf.freeUp)
                        || (ref.state.tmpSticksToSlope && ref.state.pushedBottom && sf.freeUp - sf.collidingBottom < this.mSlopeWallHeight && sf.freeUp >= sf.collidingBottom))
                        && sf.collidingBottom >= collidingBottom
                        && !(isOneWay && Math.abs(sf.collidingBottom) >= this.mSlopeWallHeight)) {
                        wasOneWay = isOneWay;
                        collidingBottom = sf.collidingBottom;
                        slopeX = x;
                    }

                    break;
                case TileCollisionType.Empty:
                    break;
                case TileCollisionType.Full:
                    ref.state.onOneWay = false;
                    ref.state.pushesBottomTile = true;
                    vec2.floor(ref.state.bottomTile, [x, bottomleftTile[1]]);
                    ref.state.tmpIgnoresOneWay = false;
                    return true;
            }
        }
        if (slopeX != -1 && (ref.state.tmpSticksToSlope || collidingBottom >= 0)) {
            if (ref.state.tmpSticksToSlope) {
                ref.state.onOneWay = wasOneWay;
                ref.state.oneWayY = bottomleftTile[1];
                ref.state.pushesBottomTile = true;
                vec2.floor(ref.state.bottomTile, [slopeX, bottomleftTile[1]]);
            }
            ref.position[1] += collidingBottom;
            ref.topRight[1] += collidingBottom;
            ref.bottomLeft[1] += collidingBottom;
            return true;
        }


        return false;
    }
    /**
     * 
     * @param {number} offset
     * @param {number} step
     * @param {{
     * position: vec2,
     * foundObstacleX: boolean,
     * topRight: vec2,
     * bottomLeft: vec2,
     * state: PositionState,
     * }} ref
     */
    moveX(offset, step, ref) {
        while (!ref.foundObstacleX && offset != 0.0) {
            offset -= step;
            if (step > 0.0)
                ref.foundObstacleX = this.collidesWithTileRight(ref, true);
            else
                ref.foundObstacleX = this.collidesWithTileLeft(ref, true);
            if (!ref.foundObstacleX) {
                ref.position[0] += step;
                ref.topRight[0] += step;
                ref.bottomLeft[0] += step;
                this.collidesWithTileTop(ref);
                this.collidesWithTileBottom(ref);
            }
        }
    }
    /**
     * 
     * @param {number} offset
     * @param {number} step
     * @param {{
     * position: vec2,
     * foundObstacleY: boolean,
     * topRight: vec2,
     * bottomLeft: vec2,
     * state: PositionState,
     * }} ref
     */
    moveY(offset, step, ref) {
        while (!ref.foundObstacleY && offset != 0.0) {
            offset -= step;
            if (step > 0.0)
                ref.foundObstacleY = this.collidesWithTileTop(ref);
            else
                ref.foundObstacleY = this.collidesWithTileBottom(ref);
            if (!ref.foundObstacleY) {
                ref.position[1] += step;
                ref.topRight[1] += step;
                ref.bottomLeft[1] += step;
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
     * topRight: vec2,
     * bottomLeft: vec2,
     * state: PositionState,
     * remainder: vec2,
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
            this.moveX(move[0], step[0], ref);
            if (step[0] > 0.0)
                ref.state.pushesLeftTile = this.collidesWithTileLeft(ref);
            else
                ref.state.pushesRightTile = this.collidesWithTileRight(ref);

        }
        else if (move[1] != 0.0 && move[0] == 0.0) {

            this.moveY(move[1], step[1], ref);
            if (step[1] > 0.0) {
                ref.state.pushesBottomTile = this.collidesWithTileBottom(ref);
            }
            else {
                ref.state.pushesTopTile = this.collidesWithTileTop(ref);
            }
            if (!this.mIgnoresOneWay && ref.state.tmpIgnoresOneWay && this.mMap.getMapTileYAtPoint(ref.bottomLeft[1] - 0.5) != ref.state.oneWayY)
                ref.state.tmpIgnoresOneWay = false;
        }
        else {
            const speedRatio = Math.abs(speed[1]) / Math.abs(speed[0]);
            let vertAccum = 0.0;
            while (!ref.foundObstacleX && !ref.foundObstacleY && (move[0] != 0.0 || move[1] != 0.0)) {

                vertAccum += sign(step[1]) * speedRatio;
                this.moveX(step[0], step[0], ref);
                move[0] -= step[0];
                while (!ref.foundObstacleY && move[1] != 0.0 && (Math.abs(vertAccum) >= 1.0 || move[0] == 0.0)) {
                    move[1] -= step[1];
                    vertAccum -= step[1];
                    this.moveY(step[1], step[1], ref);
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
            if ((this.mType == ObjectType.Player && this.mAllCollidingObjects[i].other.mType == ObjectType.NPC) || this.mType === ObjectType.NPC)
                continue;
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
                    this.tryAutoMount(other);
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
                if (speedSum[0] === 0.0) {
                    speedRatioX = 0.5;
                } else {
                    speedRatioX = absSpeed1[0] / speedSum[0];
                }
                if (speedSum[1] === 0.0) {
                    speedRatioY = 0.5;
                } else {
                    speedRatioY = absSpeed1[1] / speedSum[1];
                }
            }

            const smallestOverlap = Math.min(Math.abs(overlap[0]), Math.abs(overlap[1]));

            if (smallestOverlap == Math.abs(overlap[0])) {
                const offsetX = overlap[0] * speedRatioX;

                this.mOffset[0] += offsetX;
                offsetSum[0] += offsetX;

                if (overlap[0] < 0.0) {
                    if (other.mIsKinematic && this.mPS.pushesLeftTile)
                        this.crush();

                    this.mPS.pushesRightObject = true;
                    this.mSpeed[0] = Math.min(this.mSpeed[0], 0.0);
                }
                else {
                    if (other.mIsKinematic && this.mPS.pushesRightTile)
                        this.crush();

                    this.mPS.pushesLeftObject = true;
                    this.mSpeed[0] = Math.max(this.mSpeed[0], 0.0);
                }
            }
            else {
                const offsetY = overlap[1] * speedRatioY;

                this.mOffset[1] += offsetY;
                offsetSum[1] += offsetY;

                if (overlap[1] < 0.0) {
                    if (other.mIsKinematic && this.mPS.pushesBottomTile)
                        this.crush();

                    this.mPS.pushesTopObject = true;
                    this.mSpeed[1] = Math.min(this.mSpeed[1], 0.0);
                }
                else {
                    if (other.mIsKinematic && this.mPS.pushesTopTile)
                        this.crush();

                    this.tryAutoMount(other);
                    this.mPS.pushesBottomObject = true;
                    this.mSpeed[1] = Math.max(this.mSpeed[1], 0.0);
                }
            }
        }


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

        this.mPS.pushesBottomTile = this.mPS.pushesBottom;
        this.mPS.pushesTopTile = this.mPS.pushesTop;
        this.mPS.pushesRightTile = this.mPS.pushesRight;
        this.mPS.pushesLeftTile = this.mPS.pushesLeft;

        this.mPS.pushesBottomTile = this.mPS.pushesLeftTile = this.mPS.pushesRightTile = this.mPS.pushesTopTile =
            this.mPS.pushesBottomObject = this.mPS.pushesLeftObject = this.mPS.pushesRightObject = this.mPS.pushesTopObject = false;

        const ref = {
            position: this.mPosition,
            topRight: this.mAABB.max(),
            bottomLeft: this.mAABB.min(),
            state: this.mPS,
        }
        this.collidesWithTiles(ref);
        vec2.copy(this.mOldSpeed, this.mSpeed);
        if (this.mPS.pushesBottomTile)
            this.mSpeed[1] = Math.max(0.0, this.mSpeed[1]);
        if (this.mPS.pushesTopTile)
            this.mSpeed[1] = Math.min(0.0, this.mSpeed[1]);
        if (this.mPS.pushesLeftTile)
            this.mSpeed[0] = Math.max(0.0, this.mSpeed[0]);
        if (this.mPS.pushesRightTile)
            this.mSpeed[0] = Math.min(0.0, this.mSpeed[0]);


        vec2.copy(this.mOldPosition, this.mPosition);
        vec2.scale(this.mOffset, this.mSpeed, this.deltaTime);
        if (this.mMountParent != null) {
            if (this.hasCollisionDataFor(this.mMountParent)) {
                vec2.add(this.mOffset, this.mOffset, vec2.sub(vec2.create(), this.mMountParent.mPosition, this.mMountParent.mOldPosition));
            }
            else {
                this.mMountParent = null;
            }
        }


        vec2.add(this.mPosition, this.mPosition, vec2.round(vec2.create(), vec2.add(vec2.create(), this.mOffset, this.mRemainder)));

        vec2.copy(this.mAABB.center, this.mPosition);
    }
    updatePhysicsP2() {
        vec2.sub(this.mPosition, this.mPosition, vec2.round(vec2.create(), vec2.add(vec2.create(), this.mOffset, this.mRemainder)));
        vec2.copy(this.mAABB.center, this.mPosition);

        this.updatePhysicsResponse();

        if (this.mOffset[0] != 0.0 || this.mOffset[1] != 0.0) {
            const ref = {
                position: this.mPosition,
                state: this.mPS,
                remainder: this.mRemainder,
                topRight: this.mAABB.max(),
                bottomLeft: this.mAABB.min(),
                foundObstacleX: false,
                foundObstacleY: false,
            }
            this.move(this.mOffset, this.mSpeed, this.mAABB, ref);
        }

        this.mPS.pushesBottom = this.mPS.pushesBottomTile || this.mPS.pushesBottomObject;
        this.mPS.pushesRight = this.mPS.pushesRightTile || this.mPS.pushesRightObject;
        this.mPS.pushesLeft = this.mPS.pushesLeftTile || this.mPS.pushesLeftObject;
        this.mPS.pushesTop = this.mPS.pushesTopTile || this.mPS.pushesTopObject;
        if (!this.mPS.tmpSticksToSlope && this.mPS.pushesTop || this.mSpeed[1] <= 0.0) {
            this.mPS.tmpSticksToSlope = true;
        }
        //update the aabb 
        vec2.copy(this.mAABB.center, this.mPosition);
    }
    /**
     * 
     * @param {MovingObject} platform 
     */
    tryAutoMount(platform) {
        if (this.mMountParent == null) {
            this.mMountParent = platform;
        }
    }
    crush() {
        vec2.add(this.mPosition, this.mMap.mPosition, vec2.fromValues(this.mMap.mWidth / 2 * cTileSize, this.mMap.mHeight / 2 * cTileSize));
    }
    /**
     * 
     * @param {{
     * position: vec2,
     * topRight: vec2,
     * bottomLeft: vec2,
     * state: PositionState
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


}