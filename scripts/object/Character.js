import { Animator } from "../component/Animator.js";
import { AudioSource } from "../component/AudioSource.js";
import { vec2 } from "../libs.js";
import { cGrabLedgeEndY, cGrabLedgeStartY, cGrabLedgeTileOffsetY, cGravity, cHalfSizeX, cHalfSizeY, cJumpFramesThreshold, cJumpSpeed, cMaxFallingSpeed, cMinJumpSpeed, cSlopeWallHeight, cTileSize, cWalkSfxTime, cWalkSpeed } from "../misc/constants.js";
import { CharacterState, KeyInput } from "../misc/enums.js";
import { sign } from "../misc/math.js";
import { AudioClip } from "./AudioClip.js";
import { Map } from "./Map.js";
import { MovingObject } from "./MovingObject.js";
export class Character extends MovingObject {
    /**
     * @param {Map} map
     * @param {EnumSet<typeof KeyInput>} inputs 
     * @param {EnumSet<typeof KeyInput>} prevInputs 
     */
    constructor(map, inputs = new Set, prevInputs = new Set) {
        super(map);
        this.mInputs = inputs;
        this.mPrevInputs = prevInputs;
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
        this.mWalkSfx = new AudioClip();
        this.mLedgeTile = vec2.create();
        this.mWalkSfxTimer = 0.0;
        this.mCannotGoLeftFrames = 0;
        this.mCannotGoRightFrames = 0;
        this.mFramesFromJumpStart = 0;
        this.mSlopeWallHeight = cSlopeWallHeight;
    }
    jump() {
        this.mSpeed[1] = this.mJumpSpeed;
        this.mPS.tmpSticksToSlope = false;
        this.mAudioSource.playOneShot(this.mJumpSfx, 1.0);
        this.mCurrentState = CharacterState.Jump;
    }
    customUpdate() {
        if (this.keyState(KeyInput.ScaleUp)) {
            if (!vec2.equals(this.scale, vec2.fromValues(2, 2))) {
                const oldHeight = this.mAABB.halfSize[1];
                this.scale = vec2.fromValues(2, 2);
                this.mPosition[1] -= oldHeight - this.mAABB.halfSize[1];
            }
        } else if (this.keyState(KeyInput.ScaleDown)) {
            if (!vec2.equals(this.scale, vec2.fromValues(0.5, 0.5))) {
                const oldHeight = this.mAABB.halfSize[1];
                this.scale = vec2.fromValues(0.5, 0.5);
                this.mPosition[1] -= oldHeight - this.mAABB.halfSize[1];
            }
        } else if (this.keyState(KeyInput.ScaleNormal)) {
            if (!vec2.equals(this.scale, vec2.fromValues(1, 1))) {
                const oldHeight = this.mAABB.halfSize[1];
                this.scale = vec2.fromValues(1, 1);
                this.mPosition[1] -= oldHeight - this.mAABB.halfSize[1];
            }
        }
        switch (this.mCurrentState) {
            case CharacterState.Stand:
                this.mAnimator.play("Stand");
                vec2.zero(this.mSpeed);
                if (!this.mPS.pushesBottom) {
                    this.mCurrentState = CharacterState.Jump;
                    break;
                }
                if (this.keyState(KeyInput.GoRight) !== this.keyState(KeyInput.GoLeft)) {
                    this.mCurrentState = CharacterState.Walk;
                    break;
                } else if (this.keyState(KeyInput.Jump)) {
                    this.jump();
                    break;
                }
                if (this.keyState(KeyInput.GoDown)) {
                    this.mPS.tmpIgnoresOneWay = true;
                }
                break;
            case CharacterState.Walk:
                this.mAnimator.play("Walk");
                this.mWalkSfxTimer += this.deltaTime;

                if (this.mWalkSfxTimer > cWalkSfxTime) {
                    this.mWalkSfxTimer = 0.0;
                    this.mAudioSource.playOneShot(this.mWalkSfx, 1);
                }
                if (this.keyState(KeyInput.GoRight) === this.keyState(KeyInput.GoLeft)) {
                    this.mCurrentState = CharacterState.Stand;
                    vec2.zero(this.mSpeed);
                } else if (this.keyState(KeyInput.GoRight)) {
                    if (this.mPS.pushesRight)
                        this.mSpeed[0] = 0.0;
                    else
                        this.mSpeed[0] = this.mWalkSpeed;

                    this.mScale[0] = Math.abs(this.mScale[0]);
                } else if (this.keyState(KeyInput.GoLeft)) {
                    if (this.mPS.pushesLeft)
                        this.mSpeed[0] = 0.0;
                    else
                        this.mSpeed[0] = -this.mWalkSpeed;
                    this.mScale[0] = -Math.abs(this.mScale[0]);
                }
                if (this.keyState(KeyInput.Jump)) {
                    this.jump();
                    break;
                } else if (!this.mPS.pushesBottom) {
                    this.mCurrentState = CharacterState.Jump;
                    break;
                }
                if (this.keyState(KeyInput.GoDown)) {
                    this.mPS.tmpIgnoresOneWay = true;
                }
                break;
            case CharacterState.Jump:
                ++this.mFramesFromJumpStart;
                if (this.mFramesFromJumpStart <= cJumpFramesThreshold) {
                    if (this.mPS.pushesTop || this.mSpeed[1] > 0.0)
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
                    if (this.mPS.pushesRightTile)
                        this.mSpeed[0] = 0.0;
                    else
                        this.mSpeed[0] = this.mWalkSpeed;
                    this.mScale[0] = Math.abs(this.mScale[0]);
                } else if (this.keyState(KeyInput.GoLeft)) {
                    if (this.mPS.pushesLeftTile)
                        this.mSpeed[0] = 0.0;
                    else
                        this.mSpeed[0] = -this.mWalkSpeed;
                    this.mScale[0] = -Math.abs(this.mScale[0]);
                }
                //if we hit the ground 
                if (this.mPS.pushesBottom) {
                    //if there's no movement change state to standing 
                    if (this.keyState(KeyInput.GoRight) === this.keyState(KeyInput.GoLeft)) {
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
                }

                if (this.mCannotGoLeftFrames > 0) {
                    --this.mCannotGoLeftFrames;
                    this.mInputs.delete(KeyInput.GoLeft);
                }
                if (this.mCannotGoRightFrames > 0) {
                    --this.mCannotGoRightFrames;
                    this.mInputs.delete(KeyInput.GoRight);
                }

                if (this.mSpeed[1] <= 0.0
                    && !this.mPS.pushesTop
                    && ((this.mPS.pushesRight && this.keyState(KeyInput.GoRight)) || (this.mPS.pushesLeft && this.keyState(KeyInput.GoLeft)))) {
                    const aabbCornerOffset = vec2.create();

                    if (this.mPS.pushesRight && this.keyState(KeyInput.GoRight))
                        vec2.copy(aabbCornerOffset, this.mAABB.halfSize);
                    else
                        vec2.set(aabbCornerOffset, -this.mAABB.halfSize[0] - 1.0, this.mAABB.halfSize[1]);
                    const tileX = this.mMap.getMapTileXAtPoint(this.mAABB.center[0] + aabbCornerOffset[0])
                    let topY;
                    let bottomY;
                    if ((this.mPS.pushedLeft && this.mPS.pushesLeft) || (this.mPS.pushedRight && this.mPS.pushesRight)) {
                        topY = this.mMap.getMapTileYAtPoint(this.mOldPosition[1] + aabbCornerOffset[1] - cGrabLedgeStartY);
                        bottomY = this.mMap.getMapTileYAtPoint(this.mAABB.center[1] + aabbCornerOffset[1] - cGrabLedgeEndY);
                    }
                    else {
                        topY = this.mMap.getMapTileYAtPoint(this.mAABB.center[1] + aabbCornerOffset[1] - cGrabLedgeStartY);
                        bottomY = this.mMap.getMapTileYAtPoint(this.mAABB.center[1] + aabbCornerOffset[1] - cGrabLedgeEndY);
                    }
                    for (let y = topY; y >= bottomY; --y) {
                        if (!this.mMap.isObstacle(tileX, y)
                            && this.mMap.isObstacle(tileX, y - 1)) {
                            const tileCorner = this.mMap.getMapTilePosition(tileX, y - 1);
                            tileCorner[0] -= sign(aabbCornerOffset[0]) * cTileSize / 2;
                            tileCorner[1] += cTileSize / 2;
                            if (y > bottomY ||
                                ((this.mAABB.center[1] + aabbCornerOffset[1]) - tileCorner[1] <= cGrabLedgeEndY
                                    && tileCorner[1] - (this.mAABB.center[1] + aabbCornerOffset[1]) >= cGrabLedgeStartY)) {
                                vec2.floor(this.mLedgeTile, [tileX, y - 1]);
                                this.mPosition[1] = tileCorner[1] - aabbCornerOffset[1] - cGrabLedgeStartY + cGrabLedgeTileOffsetY;
                                vec2.zero(this.mSpeed)
                                this.mCurrentState = CharacterState.GrabLedge;
                                this.mAnimator.play("GrabLedge");
                                this.mAudioSource.playOneShot(this.mHitWallSfx, 0.5);
                                break;
                            }
                        }
                    }
                }
                if (this.keyState(KeyInput.GoDown)) {
                    this.mPS.tmpIgnoresOneWay = true;
                }
                break;
            case CharacterState.GrabLedge:
                this.mAnimator.play("GrabLedge");
                const ledgeOnLeft = this.mLedgeTile[0] * cTileSize < this.mPosition[0];
                const ledgeOnRight = !ledgeOnLeft;
                if (this.keyState(KeyInput.GoDown)
                    || (this.keyState(KeyInput.GoLeft) && ledgeOnRight)
                    || (this.keyState(KeyInput.GoRight) && ledgeOnLeft)) {
                    if (ledgeOnLeft)
                        this.mCannotGoLeftFrames = 3;
                    else
                        this.mCannotGoRightFrames = 3;
                    this.mCurrentState = CharacterState.Jump;
                } else if (this.keyState(KeyInput.Jump)) {
                    this.mSpeed[1] = this.mJumpSpeed;
                    this.mAudioSource.playOneShot(this.mJumpSfx, 1.0);
                    this.mCurrentState = CharacterState.Jump;
                }
                if (!this.mMap.isObstacle(this.mLedgeTile[0], this.mLedgeTile[1])) {
                    this.mCurrentState = CharacterState.Jump;
                }
                break;
        }
        this.updatePhysics();
        if (this.mPS.pushedBottom && !this.mPS.pushesBottom)
            this.mFramesFromJumpStart = 0;
        if ((!this.mPS.pushedBottom && this.mPS.pushesBottom))
            this.mAudioSource.playOneShot(this.mHitWallSfx, 0.5);
        this.updatePrevInputs();
    }
    init() {
        this.scale = vec2.fromValues(1, 1);
        vec2.floor(this.mPosition, this.mPosition);
        this.mAABB.halfSize = [cHalfSizeX, cHalfSizeY];

        this.mJumpSpeed = cJumpSpeed;
        this.mWalkSpeed = cWalkSpeed;
        this.mSlopeWallHeight = cSlopeWallHeight;
        this.mSpriteRenderer.initCharacter();
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