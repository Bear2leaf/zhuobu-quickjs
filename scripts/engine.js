import { SpriteRenderer } from "./component/SpriteRenderer.js";
import { activeTexture, bindEBO, bindTexture, bindVAO, bindVBO, bufferData, bufferDataElement, clear, clearColor, createBuffer, createShaderProgram, createTexture, createVAO, drawElements, enableVertexAttribute, getKey, getScreenHeight, getScreenWidth, getTime, getUniformLocation, initContext, loadImage, loadText, mat4, pollEvents, resize, setVertexAttributePointer, shouldCloseWindow, swapBuffers, terminate, uniform1f, uniform1i, uniformMatrix4fv, updateTexture, useProgram, vec2 } from "./libs.js";
import { cHalfSizeX, cHalfSizeY, cTileSize, FPS, zoom } from "./misc/constants.js";
import { KeyCode, KeyCodeGLFW, KeyInput, ObjectType, TileType } from "./misc/enums.js";
import { buildAtlas, addAtlas as loadAtlasImages, loadAtlasShaderSource } from "./object/atlas.js";
import { Character } from "./object/Character.js";
import { Map as GameMap } from "./object/Map.js";
import { MovingObject } from "./object/MovingObject.js";
import { MovingPlatform } from "./object/MovingPlatform.js";
import { Slopes } from "./object/Slopes.js";



/** @type {string}*/
let vertexShaderSource;
/** @type {string}*/
let fragmentShaderSource;

/** @type {ImageContainer} */
let image1;
/** @type {ImageContainer} */
let image2;
/** @type {MovingObject} */
let character;
/** @type {ImageContainer} */
let imageTile1;
/** @type {ImageContainer} */
let imageTile2;



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
    vertexShaderSource = await loadText("resources/glsl/demo.vert.sk");
    fragmentShaderSource = await loadText("resources/glsl/demo.frag.sk");
    image1 = await loadImage("resources/image/container.jpg");
    image2 = await loadImage("resources/image/awesomeface.png");
    imageTile1 = await loadImage("resources/image/block.png");
    imageTile2 = await loadImage("resources/image/small-platform.png");
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
export function init() {
    initContext();
    const atlas = buildAtlas();
    atlasRenderer.initTexture(atlas.texture, atlas.texture);
    atlasRenderer.initQuad(0, 0, 128, 128)
    Slopes.init();
    const program = createShaderProgram(vertexShaderSource, fragmentShaderSource);
    addProgramCache("demo", program);
    useProgram(program);
    {
        character = new Character(map, inputs, prevInputs);
        character.init();
        character.mSpriteRenderer.initImageTexture(image1, image2);
        character.mType = ObjectType.Player;
        character.mPosition[0] = 100;
        character.mPosition[1] = 200;
    }
    {
        const o = new Character(map);
        o.init();
        o.mSpriteRenderer.initImageTexture(image1, image2);
        o.mType = ObjectType.NPC;
        o.mPosition[0] = 300;
        o.mPosition[1] = 100;
        mObjects.push(o);
    }
    {
        const o = new Character(map);
        o.init();
        o.mSpriteRenderer.initImageTexture(image1, image2);
        o.mType = ObjectType.NPC;
        o.mPosition[0] = 100;
        o.mPosition[1] = 200;
        mObjects.push(o);
    }
    {
        const o = new MovingPlatform(map);
        o.init();
        o.mSpriteRenderer.initImageTexture(image1, image2);
        o.mType = ObjectType.MovingPlatform;
        o.mPosition[0] = 450;
        o.mPosition[1] = 200;
        mMovingPlatforms.push(o);
    }
    map.spriteRenderer.initMap(map);
    map.spriteRenderer.initImageTexture(imageTile1, image2);

    clearColor(0.5, 1, 0.5, 1.0);



}
export function fixedUpdate() {
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
}
const viewOffset = vec2.fromValues(0, 0);
/** @param {number} alpha  */
export function render(alpha) {
    resize();
    clear();
    const program = "demo";
    useProgram(getProgram(program));
    mat4.identity(m)
    mat4.ortho(m, -getScreenWidth() / 2, getScreenWidth() / 2, -getScreenHeight() / 2, getScreenHeight() / 2, 1, -1);
    uniformMatrix4fv(getUniformLocationCached(program, "u_projection"), false, m);
    mat4.identity(m);
    vec2.lerp(viewOffset, viewOffset, vec2.scale(vec2.create(), [character.position[0], character.position[1] + 100], zoom), 0.05);
    mat4.lookAt(m, [...viewOffset, 1], [...viewOffset, -1], [0, 1, 0]);
    uniformMatrix4fv(getUniformLocationCached(program, "u_view"), false, m);
    mat4.identity(m)
    mat4.scale(m, m, [zoom, zoom, 1]);
    uniformMatrix4fv(getUniformLocationCached(program, "u_world"), false, m);

    const model = mat4.identity(mat4.create());
    uniformMatrix4fv(getUniformLocationCached(program, "u_model"), false, model);
    map.spriteRenderer.render();

    for (let i = 0; i < mMovingPlatforms.length; ++i) {
        const obj = mMovingPlatforms[i];
        obj.mAlpha = alpha;
        const model = mat4.identity(mat4.create());
        mat4.translate(model, model, [obj.position[0], obj.position[1], 0]);
        mat4.scale(model, model, [obj.scale[0], obj.scale[1], 1]);
        uniformMatrix4fv(getUniformLocationCached(program, "u_model"), false, model);
        obj.mSpriteRenderer.render();
    }

    const objects = [character].concat(mObjects);
    for (let i = 0; i < objects.length; ++i) {
        const obj = objects[i];
        obj.mAlpha = alpha;
        const model = mat4.identity(mat4.create());
        mat4.translate(model, model, [obj.position[0], obj.position[1], 0]);
        mat4.scale(model, model, [obj.scale[0], obj.scale[1], 1]);
        uniformMatrix4fv(getUniformLocationCached(program, "u_model"), false, model);
        obj.mSpriteRenderer.render();
    }
    {
        const model = mat4.identity(mat4.create());
        uniformMatrix4fv(getUniformLocationCached(program, "u_model"), false, model);
        atlasRenderer.render();
    }
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
            console.log(`FPS: ${frames} Updates: ${updates}`);
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
            console.log(`FPS: ${frames} Updates: ${updates}`);
            updates = 0, frames = 0;
        }
        requestAnimationFrame(loop);
    }
    loop();

}