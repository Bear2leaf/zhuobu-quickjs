import { DialogRenderer } from "./component/DialogRenderer.js";
import { SpriteRenderer } from "./component/SpriteRenderer.js";
import { TextRenderer } from "./component/TextRenderer.js";
import { clear, clearColor, createShaderProgram, getKey, getScreenHeight, getScreenWidth, getTime, getUniformLocation, initContext, loadAudio, loadImage, loadText, mat4, playAudio, pollEvents, resize, shouldCloseWindow, stopAudio, swapBuffers, terminate, uniformMatrix4fv, useProgram, vec2 } from "./libs.js";
import { cTileSize, FPS, zoom } from "./misc/constants.js";
import { KeyCode, KeyCodeGLFW, KeyInput, ObjectType } from "./misc/enums.js";
import { buildAtlas, addAtlas as loadAtlasImages, loadAtlasShaderSource } from "./object/atlas.js";
import { Character } from "./object/Character.js";
import { Map as GameMap } from "./object/Map.js";
import { MovingObject } from "./object/MovingObject.js";
import { MovingPlatform } from "./object/MovingPlatform.js";
import { Slopes } from "./object/Slopes.js";


/** @type {string}*/
let fontSource;
/** @type {string}*/
let vertexShaderSource;
/** @type {string}*/
let fragmentShaderSource;
/** @type {string}*/
let textVertexShaderSource;
/** @type {string}*/
let textFragmentShaderSource;

/** @type {ImageContainer} */
let imageFont;
/** @type {MovingObject} */
let character;



/** @type {EnumSet<typeof KeyInput>} */
const inputs = new Set();

/** @type {EnumSet<typeof KeyInput>} */
const prevInputs = new Set();

export const programCache = new Map();
export const cacheUniformLocation = new Map();
/**
 *
 * @param {string} name
 * @param {WebGLProgram} program
 */

export function addProgramCache(name, program) {

    programCache.set(name, program);
}
/**
 *
 * @param {string} program
 * @param {string} name
 * @returns
 */
export function getUniformLocationCached(program, name) {

    const key = `${program}-${name}`;
    if (cacheUniformLocation.has(key)) {
        return cacheUniformLocation.get(key);
    }
    const location = getUniformLocation(programCache.get(program), name);
    cacheUniformLocation.set(key, location);
}
/**
 * @param {string} name
 * @returns {WebGLProgram}
 */
export function getProgram(name) {
    if (programCache.has(name)) {
        return programCache.get(name);
    }
    throw new Error(`Program ${name} not found`);
}


export async function load() {
    dialogRenderer.initStory(await loadText("resources/story/story.txt"));
    vertexShaderSource = await loadText("resources/glsl/sprite.vert.sk");
    fragmentShaderSource = await loadText("resources/glsl/sprite.frag.sk");
    textVertexShaderSource = await loadText("resources/glsl/text.vert.sk");
    textFragmentShaderSource = await loadText("resources/glsl/text.frag.sk");
    fontSource = await loadText("resources/font/NotoSansSC-Regular.json");
    imageFont = await loadImage("resources/font/NotoSansSC-Regular.png");
    await loadAudio("resources/audio/song18.mp3");
    await loadAudio("resources/audio/bleep.mp3");
    await loadAtlasShaderSource();
    await loadAtlasImages();
}

const m = mat4.create();
/** @type {Array<MovingObject>} */
const mObjects = new Array();
/** @type {Array<MovingObject>} */
const mMovingPlatforms = new Array();
const map = new GameMap();

const atlasRenderer = new SpriteRenderer();
const textRenderer = new TextRenderer();
const dialogRenderer = new DialogRenderer();
export function init() {
    initContext();
    playAudio(0, 1, true);
    const atlas = buildAtlas();
    atlasRenderer.setAtlas(atlas);
    atlasRenderer.initQuad(0, 0, atlas.atlasSize, atlas.atlasSize);
    Slopes.init();
    {
        const program = createShaderProgram(textVertexShaderSource, textFragmentShaderSource);
        addProgramCache("text", program);
        useProgram(program);
    }
    textRenderer.initImageTexture(imageFont);
    textRenderer.setFont(JSON.parse(fontSource));
    textRenderer.initText();
    {
        dialogRenderer.initImageTexture(imageFont);
        dialogRenderer.setFont(JSON.parse(fontSource));
        dialogRenderer.initText();
        dialogRenderer.updateText();
    }
    {
        const program = createShaderProgram(vertexShaderSource, fragmentShaderSource);
        addProgramCache("sprite", program);
        useProgram(program);
    }
    {
        character = new Character(map, inputs, prevInputs);
        character.mSpriteRenderer.setAtlas(atlas);
        character.init();
        character.mType = ObjectType.Player;
        character.mPosition[0] = 0;
        character.mPosition[1] = 200;
    }
    // {
    //     const o = new Character(map);
    //     o.mSpriteRenderer.setAtlas(atlas);
    //     o.init();
    //     o.mType = ObjectType.NPC;
    //     o.mPosition[0] = 300;
    //     o.mPosition[1] = 100;
    //     mObjects.push(o);
    // }
    // {
    //     const o = new Character(map);
    //     o.mSpriteRenderer.setAtlas(atlas);
    //     o.init();
    //     o.mType = ObjectType.NPC;
    //     o.mPosition[0] = 100;
    //     o.mPosition[1] = 200;
    //     mObjects.push(o);
    // }
    // {
    //     const o = new MovingPlatform(map);
    //     o.mSpriteRenderer.setAtlas(atlas);
    //     o.init();
    //     o.mType = ObjectType.MovingPlatform;
    //     o.mPosition[0] = 150;
    //     o.mPosition[1] = 200;
    //     mMovingPlatforms.push(o);
    // }
    map.spriteRenderer.setAtlas(atlas);
    map.spriteRenderer.initMap(map);

    clearColor(0.5, 1, 0.5, 1.0);



}
let audioOn = true;
export function fixedUpdate() {
    if (audioOn) {
        if (inputs.has(KeyInput.DisableAudio)) {
            stopAudio(0);
            audioOn = false;
        }
    } else {
        if (inputs.has(KeyInput.EnableAudio)) {
            playAudio(0, 1, true);
            audioOn = true;
        }
    }
    dialogRenderer.updateSelection(inputs, prevInputs);
    const objs = mMovingPlatforms.concat([character]).concat(mObjects);
    for (const obj of objs) {
        switch (obj.mType) {
            case ObjectType.Player:
            case ObjectType.NPC:
            case ObjectType.MovingPlatform:
                obj.deltaTime = 1 / FPS;
                obj.customUpdate();
                map.updateAreas(obj);
                obj.mAllCollidingObjects.splice(0, obj.mAllCollidingObjects.length);
                break;
        }

    }
    map.checkCollisions();
    for (const element of objs) {
        element.updatePhysicsP2();
        element.tickPosition();
    }
    const collisions = character.mAllCollidingObjects;
    textRenderer.message = `Collisions: ${collisions.length}\n${collectCollisions()}`;
    textRenderer.updateText();
}
function collectCollisions() {
    const collisions = character.mAllCollidingObjects;
    /** @type {Record<string, number>} */
    const info = {};
    for (const collision of collisions) {
        const type = Object.keys(ObjectType)[collision.other.mType];
        if (info[type] === undefined) {
            info[type] = 0;
        }
        info[type]++;
    }
    if (collisions.length !== 0) {
        dialogRenderer.visible = true;
    } else {
        dialogRenderer.visible = false
    }
    return Object.keys(info).map((key) => `${key}: ${info[key]}`).join("\n");
}
const viewOffset = vec2.fromValues(0, 0);
/** @param {number} alpha  */
export function render(alpha) {
    resize();
    clear();
    const program = "sprite";
    useProgram(getProgram(program));
    mat4.identity(m)
    mat4.ortho(m, -getScreenWidth() / 2, getScreenWidth() / 2, -getScreenHeight() / 2, getScreenHeight() / 2, 1, -1);
    uniformMatrix4fv(getUniformLocationCached(program, "u_projection"), false, m);
    mat4.identity(m);
    vec2.lerp(viewOffset, viewOffset, vec2.scale(vec2.create(), [character.position[0], character.position[1]], zoom), 0.05);
    clampViewOffset(viewOffset);
    const rounded = vec2.round(vec2.create(), viewOffset);
    mat4.lookAt(m, [...rounded, 1], [...rounded, -1], [0, 1, 0]);
    uniformMatrix4fv(getUniformLocationCached(program, "u_view"), false, m);
    mat4.identity(m)
    mat4.scale(m, m, [zoom, zoom, 1]);
    uniformMatrix4fv(getUniformLocationCached(program, "u_world"), false, m);
    const currentX = Math.floor(character.position[0] / (map.mWidth * cTileSize));
    for (let i = currentX - 2; i < currentX + 3; ++i) {
        mat4.identity(m);
        mat4.translate(m, m, [i * map.mWidth * cTileSize, 0, 0]);
        uniformMatrix4fv(getUniformLocationCached(program, "u_model"), false, m);
        map.spriteRenderer.render();
    }

    for (let i = 0; i < mMovingPlatforms.length; ++i) {
        const obj = mMovingPlatforms[i];
        obj.mAlpha = alpha;
        mat4.identity(m);
        mat4.translate(m, m, [obj.position[0], obj.position[1], 0]);
        mat4.scale(m, m, [obj.scale[0], obj.scale[1], 1]);
        uniformMatrix4fv(getUniformLocationCached(program, "u_model"), false, m);
        obj.mSpriteRenderer.render();
    }

    mat4.lookAt(m, [...viewOffset, 1], [...viewOffset, -1], [0, 1, 0]);
    uniformMatrix4fv(getUniformLocationCached(program, "u_view"), false, m);
    const objects = [character].concat(mObjects);
    for (let i = 0; i < objects.length; ++i) {
        const obj = objects[i];
        obj.mAlpha = alpha;
        mat4.identity(m);
        mat4.translate(m, m, [obj.position[0], obj.position[1], 0]);
        mat4.scale(m, m, [obj.scale[0], obj.scale[1], 1]);
        uniformMatrix4fv(getUniformLocationCached(program, "u_model"), false, m);
        obj.mSpriteRenderer.render();
    }
    {
        mat4.identity(m);
        mat4.translate(m, m, [100, getScreenHeight() - 128, 0]);
        uniformMatrix4fv(getUniformLocationCached(program, "u_model"), false, m);
        atlasRenderer.render();
    }
    {
        textRenderer.render();
    }
    if (dialogRenderer.visible) {
        dialogRenderer.render();
    }
}
/**
 * 
 * @param {vec2} viewOffset 
 */
function clampViewOffset(viewOffset) {
    const mapTop = (getScreenHeight() - cTileSize) / 2;
    const mapLeft = (getScreenWidth() - cTileSize) / 2;
    const mapRight = map.mWidth * cTileSize - (getScreenWidth() + cTileSize) / 2;
    const mapBottom = map.mHeight * cTileSize - (getScreenHeight() + cTileSize) / 2;
    // const x = Math.min(mapRight, Math.max(mapLeft, viewOffset[0]));
    const y = Math.min(mapBottom, Math.max(mapTop, viewOffset[1]));
    // viewOffset[0] = x;
    // viewOffset[1] = y;

}
/**
 * @type {typeof KeyCodeGLFW | typeof KeyCode}
 */
let keys;
function update() {

    if (getKey(keys.RightKey)) {
        inputs.add(KeyInput.GoRight)
    } else {
        inputs.delete(KeyInput.GoRight)
    }
    if (getKey(keys.LeftKey)) {
        inputs.add(KeyInput.GoLeft);
    } else {
        inputs.delete(KeyInput.GoLeft)
    }
    if (getKey(keys.DownKey)) {
        inputs.add(KeyInput.GoDown)
    } else {
        inputs.delete(KeyInput.GoDown)
    }
    if (getKey(keys.JumpKey)) {
        inputs.add(KeyInput.Jump);
    } else {
        inputs.delete(KeyInput.Jump)
    }
    if (getKey(keys.Minus)) {
        inputs.add(KeyInput.ScaleDown);
    } else {
        inputs.delete(KeyInput.ScaleDown)
    }
    if (getKey(keys.Equal)) {
        inputs.add(KeyInput.ScaleUp);
    } else {
        inputs.delete(KeyInput.ScaleUp)
    }
    if (getKey(keys.M)) {
        inputs.add(KeyInput.DisableAudio);
    } else {
        inputs.delete(KeyInput.DisableAudio)
    }
    if (getKey(keys.N)) {
        inputs.add(KeyInput.EnableAudio);
    } else {
        inputs.delete(KeyInput.EnableAudio)
    }
    if (getKey(keys.Backspace)) {
        inputs.add(KeyInput.ScaleNormal);
    } else {
        inputs.delete(KeyInput.ScaleNormal)
    }
    if (getKey(keys.UpKey)) {
        inputs.add(KeyInput.Up);
    } else {
        inputs.delete(KeyInput.Up)
    }
}
export async function mainQuickjs() {
    keys = KeyCodeGLFW;
    await load();
    init();
    let acc = 0;
    let lastTime = getTime();
    let timer = lastTime;
    let frames = 0;
    let updates = 0;
    while (!shouldCloseWindow()) {
        const currentTime = getTime();
        const delta = (currentTime - lastTime) / (1 / FPS);
        acc += delta;
        lastTime = currentTime;
        update();
        while (acc >= 1) {
            fixedUpdate();
            updates++;
            acc--;
        }
        render(acc);
        swapBuffers();
        pollEvents();
        frames++;
        // - Reset after one second
        if (getTime() - timer > 1.0) {
            timer++;
            const msg = `FPS: ${frames} Updates: ${updates}`;
            textRenderer.status = (msg);
            textRenderer.updateText();
            updates = 0, frames = 0;
        }
    }
    terminate();
}
export async function main() {
    keys = KeyCode;
    await load();
    init();
    let acc = 0;
    let lastTime = getTime();
    let timer = lastTime;
    let frames = 0;
    let updates = 0;
    function loop() {
        const currentTime = getTime();
        const delta = (currentTime - lastTime) / (1 / FPS);
        acc += delta;
        lastTime = currentTime;
        update();
        while (acc >= 1) {
            fixedUpdate();
            updates++;
            acc--;
        }
        render(acc);
        frames++;

        // - Reset after one second
        if (getTime() - timer > 1.0) {
            timer++;
            const msg = `FPS: ${frames} Updates: ${updates}`;
            textRenderer.status = (msg);
            textRenderer.updateText();
            updates = 0, frames = 0;
        }
        requestAnimationFrame(loop);
    }
    loop();

}