import { Animator } from "../component/Animator.js";
import { AudioSource } from "../component/AudioSource.js";
import { vec2 } from "../libs.js";
import { cGravity, cHalfSizeX, cHalfSizeY, cJumpSpeed, cMaxFallingSpeed, cMinJumpSpeed, cOneWayPlatformThreshold, cWalkSfxTime, cWalkSpeed } from "../misc/constants.js";
import { CharacterState, KeyInput } from "../misc/enums.js";
import { AudioClip } from "./AudioClip.js";
import { MovingObject } from "./MovingObject.js";
export class Character extends MovingObject {
    constructor() {
        super();
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
    }
    /**
     * 
     * @param {EnumSet<typeof KeyInput>} inputs 
     * @param {EnumSet<typeof KeyInput>} prevInputs 
     */
    characterInit(inputs, prevInputs) {
        this.mPosition = this.position;
        vec2.set(this.mAABB.halfSize, cHalfSizeX, cHalfSizeY);
        this.mAABBOffset[1] = this.mAABB.halfSize[1];
        this.mInputs = inputs;
        this.mPrevInputs = prevInputs;

        this.mJumpSpeed = cJumpSpeed;
        this.mWalkSpeed = cWalkSpeed;

        vec2.set(this.mScale, 1, 1);
    }
    characterUpdate() {
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

                    this.mScale[0] = Math.abs(this.mScale[0]);
                } else if (this.keyState(KeyInput.GoLeft)) {
                    if (this.mPushesLeftWall)
                        this.mSpeed[0] = 0.0;
                    else
                        this.mSpeed[0] = -this.mWalkSpeed;
                    this.mScale[0] = -Math.abs(this.mScale[0]);
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
                    this.mScale[0] = -Math.abs(this.mScale[0]);
                } else if (this.keyState(KeyInput.GoLeft)) {
                    if (this.mPushesLeftWall)
                        this.mSpeed[0] = 0.0;
                    else
                        this.mSpeed[0] = -this.mWalkSpeed;
                    this.mScale[0] = Math.abs(this.mScale[0]);
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
                }
                break;
            case CharacterState.GrabLedge:
                break;
        }
        this.updatePhysics();
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