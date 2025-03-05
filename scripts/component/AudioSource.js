import { playAudio } from "../libs.js";
import { AudioClip } from "../object/AudioClip.js";

export class AudioSource {
    constructor() {
        
    }
    /**
     * 
     * @param {AudioClip} clip 
     * @param {number} volume 
     */
    playOneShot(clip, volume) {
        playAudio(clip.id, volume, false);
    }
}