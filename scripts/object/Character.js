import { Animator } from "../component/Animator.js";
import { AudioSource } from "../component/AudioSource.js";
import { vec2 } from "../libs.js";
import { cGrabLedgeEndY, cGrabLedgeStartY, cGrabLedgeTileOffsetY, cGravity, cHalfSizeX, cHalfSizeY, cJumpFramesThreshold, cJumpSpeed, cMaxFallingSpeed, cMinJumpSpeed, cOneWayPlatformThreshold, cTileSize, cWalkSfxTime, cWalkSpeed } from "../misc/constants.js";
import { CharacterState, KeyInput, ObjectType, TileType } from "../misc/enums.js";
import { AudioClip } from "./AudioClip.js";
import { Map } from "./Map.js";
import { MovingObject } from "./MovingObject.js";
export class Character extends MovingObject {
    /** @param {Map} map */
    constructor(map) {
        super(map);
        /**
         * @type {EnumSet<typeof KeyInput>}
         */
        this.mInputs = new Set();
        /**
         * @type {EnumSet<typeof KeyInput>}
         */
        this.mPrevInputs = new Set();
        /**
         * @type {EnumValue<typeof CharacterState>}
         */
        this.mCurrentState = CharacterState.Stand;
        this.mJumpSpeed = cJumpSpeed;
        this.mWalkSpeed = cWalkSpeed;
        this.mAnimator = new Animator();
        this.mAudioSource = new AudioSource();
        this.mJumpSfx = new AudioClip();
        this.mHitWallSfx = new AudioClip();

        this.mLedgeTile = vec2.create();

        this.mCannotGoLeftFrames = 0;
        this.mCannotGoRightFrames = 0;
        this.mFramesFromJumpStart = 0;
    }
    customUpdate() {
        this.characterUpdate();
    }
    /**
     * 
     * @param {EnumSet<typeof KeyInput>} inputs 
     * @param {EnumSet<typeof KeyInput>} prevInputs 
     */
    characterInit(inputs, prevInputs) {
        this.mPosition = this.position;
        this.mAABB.halfSize = [cHalfSizeX, cHalfSizeY];
        this.aabbOffset = [0, this.mAABB.halfSize[1]];
        this.mInputs = inputs;
        this.mPrevInputs = prevInputs;

        this.mJumpSpeed = cJumpSpeed;
        this.mWalkSpeed = cWalkSpeed;

    }
    characterUpdate() {
        if (this.keyState(KeyInput.ScaleUp)) {
            this.scale = vec2.fromValues(2, 2);
        } else if (this.keyState(KeyInput.ScaleDown)) {
            this.scale = vec2.fromValues(0.5, 0.5);
        }
        switch (this.mCurrentState) {
            case CharacterState.Stand:
                this.mAnimator.play("Stand");
                vec2.zero(this.mSpeed);
                if (!this.mOnGround) {
                    this.mCurrentState = CharacterState.Jump;
                    break;
                }
                if (this.keyState(KeyInput.GoRight) !== this.keyState(KeyInput.GoLeft)) {
                    this.mCurrentState = CharacterState.Walk;
                    break;
                } else if (this.keyState(KeyInput.Jump)) {
                    this.mSpeed[1] = this.mJumpSpeed;
                    this.mCurrentState = CharacterState.Jump;
                    break;
                }
                if (this.keyState(KeyInput.GoDown)) {
                    if (this.mOnOneWayPlatform)
                        this.mPosition[1] -= cOneWayPlatformThreshold;
                }
                break;
            case CharacterState.Walk:
                if (this.keyState(KeyInput.GoRight) === this.keyState(KeyInput.GoLeft)) {
                    this.mCurrentState = CharacterState.Stand;
                    vec2.zero(this.mSpeed);
                } else if (this.keyState(KeyInput.GoRight)) {
                    if (this.mPushesRightWall)
                        this.mSpeed[0] = 0.0;
                    else
                        this.mSpeed[0] = this.mWalkSpeed;

                    this.scale[0] = Math.abs(this.scale[0]);
                } else if (this.keyState(KeyInput.GoLeft)) {
                    if (this.mPushesLeftWall)
                        this.mSpeed[0] = 0.0;
                    else
                        this.mSpeed[0] = -this.mWalkSpeed;
                    this.scale[0] = -Math.abs(this.scale[0]);
                }
                if (this.keyState(KeyInput.Jump)) {
                    this.mSpeed[1] = this.mJumpSpeed;
                    this.mAudioSource.playOneShot(this.mJumpSfx, 1.0);
                    this.mCurrentState = CharacterState.Jump;
                    break;
                } else if (!this.mOnGround) {
                    this.mCurrentState = CharacterState.Jump;
                    break;
                }
                if (this.keyState(KeyInput.GoDown)) {
                    if (this.mOnOneWayPlatform)
                        this.mPosition[1] -= cOneWayPlatformThreshold;
                }
                break;
            case CharacterState.Jump:
                ++this.mFramesFromJumpStart;
                if (this.mFramesFromJumpStart <= cJumpFramesThreshold) {
                    if (this.mAtCeiling || this.mSpeed[1] > 0.0)
                        this.mFramesFromJumpStart = cJumpFramesThreshold + 1;
                    else if (this.keyState(KeyInput.Jump))
                        this.mSpeed[1] = this.mJumpSpeed;
                }
                this.mWalkSfxTimer = cWalkSfxTime;

                this.mAnimator.play("Jump");
                this.mSpeed[1] += cGravity * this.deltaTime;
                this.mSpeed[1] = Math.max(this.mSpeed[1], cMaxFallingSpeed);
                if (!this.keyState(KeyInput.Jump) && this.mSpeed[1] > 0.0) {
                    this.mSpeed[1] = Math.min(this.mSpeed[1], cMinJumpSpeed);
                }
                if (this.keyState(KeyInput.GoRight) === this.keyState(KeyInput.GoLeft)) {
                    this.mSpeed[0] = 0.0;
                } else if (this.keyState(KeyInput.GoRight)) {
                    if (this.mPushesRightWall)
                        this.mSpeed[0] = 0.0;
                    else
                        this.mSpeed[0] = this.mWalkSpeed;
                    this.scale[0] = -Math.abs(this.scale[0]);
                } else if (this.keyState(KeyInput.GoLeft)) {
                    if (this.mPushesLeftWall)
                        this.mSpeed[0] = 0.0;
                    else
                        this.mSpeed[0] = -this.mWalkSpeed;
                    this.scale[0] = Math.abs(this.scale[0]);
                }
                if (this.mCannotGoLeftFrames > 0) {
                    --this.mCannotGoLeftFrames;
                    this.mInputs.delete(KeyInput.GoLeft);
                }
                if (this.mCannotGoRightFrames > 0) {
                    --this.mCannotGoRightFrames;
                    this.mInputs.delete(KeyInput.GoRight);
                }

                //if we hit the ground 
                if (this.mOnGround) {
                    //if there's no movement change state to standing 
                    if (this.mInputs.has(KeyInput.GoRight) === this.mInputs.has(KeyInput.GoLeft)) {
                        this.mCurrentState = CharacterState.Stand;
                        vec2.zero(this.mSpeed)
                        this.mAudioSource.playOneShot(this.mHitWallSfx, 0.5);
                    }
                    else    //either go right or go left are pressed so we change the state to walk 
                    {
                        this.mCurrentState = CharacterState.Walk;
                        this.mSpeed[1] = 0.0;
                        this.mAudioSource.playOneShot(this.mHitWallSfx, 0.5);
                    }
                } else if (this.mSpeed[1] <= 0.0
                    && !this.mAtCeiling
                    && ((this.mPushesRightWall && this.keyState(KeyInput.GoRight)) || (this.mPushesLeftWall && this.keyState(KeyInput.GoLeft)))) {
                    const aabbCornerOffset = vec2.create();
                    if (this.mPushesRightWall && this.mInputs.has(KeyInput.GoRight))
                        vec2.copy(aabbCornerOffset, this.mAABB.halfSize);
                    else
                        vec2.set(aabbCornerOffset, -this.mAABB.halfSize[0] - 1.0, this.mAABB.halfSize[1]);
                    const tileX = this.mMap.getMapTileXAtPoint(this.mAABB.center[0] + aabbCornerOffset[0])
                    let topY;
                    let bottomY;
                    if ((this.mPushedLeftWall && this.mPushesLeftWall) || (this.mPushedRightWall && this.mPushesRightWall)) {
                        topY = this.mMap.getMapTileYAtPoint(this.mOldPosition[1] + this.aabbOffset[1] + aabbCornerOffset[1] - cGrabLedgeStartY);
                        bottomY = this.mMap.getMapTileYAtPoint(this.mAABB.center[1] + aabbCornerOffset[1] - cGrabLedgeEndY);
                    }
                    else {
                        topY = this.mMap.getMapTileYAtPoint(this.mAABB.center[1] + aabbCornerOffset[1] - cGrabLedgeStartY);
                        bottomY = this.mMap.getMapTileYAtPoint(this.mAABB.center[1] + aabbCornerOffset[1] - cGrabLedgeEndY);
                    }
                    for (let y = topY; y >= bottomY; --y) {
                        if (!this.mMap.isObstacle(tileX, y)
                            && this.mMap.isObstacle(tileX, y - 1)) {
                            var tileCorner = this.mMap.getMapTilePosition(tileX, y - 1);
                            tileCorner[0] -= Math.sign(aabbCornerOffset[0]) * cTileSize / 2;
                            tileCorner[1] += cTileSize / 2;
                            if (y > bottomY ||
                                ((this.mAABB.center[1] + aabbCornerOffset[1]) - tileCorner[1] <= cGrabLedgeEndY
                                    && tileCorner[1] - (this.mAABB.center[1] + aabbCornerOffset[1]) >= cGrabLedgeStartY)) {
                                vec2.set(this.mLedgeTile, tileX, y - 1);
                                this.mPosition[1] = tileCorner[1] - aabbCornerOffset[1] - this.aabbOffset[1] - cGrabLedgeStartY + cGrabLedgeTileOffsetY;
                                vec2.zero(this.mSpeed)
                                this.mCurrentState = CharacterState.GrabLedge;
                                break;
                            }
                        }
                    }
                }
                break;
            case CharacterState.GrabLedge:
                const ledgeOnLeft = this.mLedgeTile[0] * cTileSize < this.mPosition[0];
                const ledgeOnRight = !ledgeOnLeft;
                if (this.mInputs.has(KeyInput.GoDown)
                    || (this.mInputs.has(KeyInput.GoLeft) && ledgeOnRight)
                    || (this.mInputs.has(KeyInput.GoRight) && ledgeOnLeft)) {
                    if (ledgeOnLeft)
                        this.mCannotGoLeftFrames = 3;
                    else
                        this.mCannotGoRightFrames = 3;
                    this.mCurrentState = CharacterState.Jump;
                } else if (this.mInputs.has(KeyInput.Jump)) {
                    this.mSpeed[1] = this.mJumpSpeed;
                    this.mCurrentState = CharacterState.Jump;
                }
                break;
        }
        this.updatePhysics();
        if (this.mWasOnGround && !this.mOnGround)
            this.mFramesFromJumpStart = 0;
        if ((!this.mWasOnGround && this.mOnGround)
            || (!this.mWasAtCeiling && this.mAtCeiling)
            || (!this.mPushedLeftWall && this.mPushesLeftWall)
            || (!this.mPushedRightWall && this.mPushesRightWall))
            this.mAudioSource.playOneShot(this.mHitWallSfx, 0.5);
        this.updatePrevInputs();
    }

    updatePrevInputs() {
        this.mPrevInputs.clear();
        for (const key of this.mInputs) {
            this.mPrevInputs.add(key);
        }
    }

    /**
     * 
     * @param {EnumValue<typeof KeyInput>} key 
     * @returns {boolean}
     */
    released(key) {
        return (!this.mInputs.has(key) && this.mPrevInputs.has(key));
    }
    /**
     * 
     * @param {EnumValue<typeof KeyInput>} key 
     * @returns {boolean}
     */
    keyState(key) {
        return (this.mInputs.has(key));
    }
    /**
     * 
     * @param {EnumValue<typeof KeyInput>} key 
     * @returns {boolean}
     */
    pressed(key) {
        return (this.mInputs.has(key) && !this.mPrevInputs.has(key));
    }
}