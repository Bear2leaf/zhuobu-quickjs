import { activeTexture, bindEBO, bindTexture, bindVAO, bindVBO, bufferData, bufferDataElement, clear, clearColor, createBuffer, createShaderProgram, createTexture, createVAO, drawElements, enableVertexAttribute, getKey, getScreenHeight, getScreenWidth, getTime, getUniformLocation, initContext, loadImage, loadText, mat4, pollEvents, resize, setVertexAttributePointer, shouldCloseWindow, swapBuffers, terminate, uniform1f, uniform1i, uniformMatrix4fv, updateTexture, useProgram, vec2 } from "./libs.js";
import { cHalfSizeX, cHalfSizeY, cTileSize, FPS, zoom } from "./misc/constants.js";
import { KeyCode, KeyCodeGLFW, KeyInput, ObjectType, TileType } from "./misc/enums.js";
import { Character } from "./object/Character.js";
import { Map as GameMap } from "./object/Map.js";
import { MovingObject } from "./object/MovingObject.js";
import { MovingPlatform } from "./object/MovingPlatform.js";
import { Slopes } from "./object/Slopes.js";



/** @type {WebGLVertexArrayObject} */
let vao;
/** @type {WebGLVertexArrayObject} */
let vaoTile;
/** @type {WebGLVertexArrayObject} */
let vaoMovingPlatform;


/** @type {string}*/
let vertexShaderSource;
/** @type {string}*/
let fragmentShaderSource;

/** @type {ImageContainer} */
let image1;
/** @type {ImageContainer} */
let image2;
/** @type {WebGLTexture} */
let tex1;
/** @type {WebGLTexture} */
let tex2;
/** @type {MovingObject} */
let character;
/** @type {ImageContainer} */
let imageTile1;
/** @type {ImageContainer} */
let imageTile2;
/** @type {WebGLTexture} */
let texTile1;
/** @type {WebGLTexture} */
let texTile2;



/** @type {EnumSet<typeof KeyInput>} */
const inputs = new Set();

/** @type {EnumSet<typeof KeyInput>} */
const prevInputs = new Set();

export async function load() {
    vertexShaderSource = await loadText("resources/glsl/demo.vert.sk");
    fragmentShaderSource = await loadText("resources/glsl/demo.frag.sk");
    image1 = await loadImage("resources/image/container.jpg");
    image2 = await loadImage("resources/image/awesomeface.png");
    imageTile1 = await loadImage("resources/image/block.png");
    imageTile2 = await loadImage("resources/image/small-platform.png");
}

const position = new Float32Array([
    cHalfSizeX, cHalfSizeY, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0,
    cHalfSizeX, -cHalfSizeY, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0,
    -cHalfSizeX, -cHalfSizeY, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0,
    -cHalfSizeX, cHalfSizeY, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0
]);
const positionTile = new Float32Array([
    +cTileSize / 2, +cTileSize / 2, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0,
    +cTileSize / 2, -cTileSize / 2, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0,
    -cTileSize / 2, -cTileSize / 2, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0,
    -cTileSize / 2, +cTileSize / 2, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0
]);
const positionMovingPlatform = new Float32Array([
    +32, +8, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0,
    +32, -8, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0,
    -32, -8, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0,
    -32, +8, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0
]);
const m = mat4.create();
/** @type {Array<MovingObject>} */
const mObjects = new Array();
/** @type {Array<MovingObject>} */
const mMovingPlatforms = new Array();
const map = new GameMap();
export function init() {
    initContext();
    Slopes.init();
    {
        character = new Character(map, inputs, prevInputs);
        character.init();
        character.mType = ObjectType.Player;
        character.mPosition[0] = 100;
        character.mPosition[1] = 200;
    }
    {
        const o = new Character(map);
        o.init();
        o.mType = ObjectType.NPC;
        o.mPosition[0] = 300;
        o.mPosition[1] = 100;
        mObjects.push(o);
    }
    {
        const o = new Character(map);
        o.init();
        o.mType = ObjectType.NPC;
        o.mPosition[0] = 100;
        o.mPosition[1] = 200;
        mObjects.push(o);
    }
    {
        const o = new MovingPlatform(map);
        o.init();
        o.mType = ObjectType.MovingPlatform;
        o.mPosition[0] = 450;
        o.mPosition[1] = 200;
        mMovingPlatforms.push(o);
    }
    clearColor(0.5, 1, 0.5, 1.0);
    const program = createShaderProgram(vertexShaderSource, fragmentShaderSource);
    programCache.set("demo", program);
    useProgram(program);
    vao = createVAO();
    const vbo = createBuffer();
    const ebo = createBuffer();
    bindVAO(vao);
    bindVBO(vbo);
    bufferData(position);
    bindEBO(ebo);
    bufferDataElement(new Uint32Array([
        0, 1, 3,  // first Triangle
        1, 2, 3   // second Triangle
    ]));
    setVertexAttributePointer(0, 3, false, 8, 0);
    enableVertexAttribute(0);
    setVertexAttributePointer(1, 3, false, 8, 3);
    enableVertexAttribute(1);
    setVertexAttributePointer(2, 2, false, 8, 6);
    enableVertexAttribute(2);

    tex1 = createTexture();
    tex2 = createTexture();
    activeTexture(0);
    bindTexture(tex1);
    updateTexture(image1);
    activeTexture(1);
    bindTexture(tex2);
    updateTexture(image2);


    vaoTile = createVAO();
    const vboTile = createBuffer();
    const eboTile = createBuffer();
    bindVAO(vaoTile);
    bindVBO(vboTile);
    bufferData(positionTile);
    bindEBO(eboTile);
    bufferDataElement(new Uint32Array([
        0, 1, 3,  // first Triangle
        1, 2, 3   // second Triangle
    ]));
    setVertexAttributePointer(0, 3, false, 8, 0);
    enableVertexAttribute(0);
    setVertexAttributePointer(1, 3, false, 8, 3);
    enableVertexAttribute(1);
    setVertexAttributePointer(2, 2, false, 8, 6);
    enableVertexAttribute(2);

    texTile1 = createTexture();
    texTile2 = createTexture();
    activeTexture(0);
    bindTexture(texTile1);
    updateTexture(imageTile1);
    activeTexture(1);
    bindTexture(texTile2);
    updateTexture(image2);


    vaoMovingPlatform = createVAO();
    const vboMovingPlatform = createBuffer();
    const eboMovingPlatform = createBuffer();
    bindVAO(vaoMovingPlatform);
    bindVBO(vboMovingPlatform);
    bufferData(positionMovingPlatform);
    bindEBO(eboMovingPlatform);
    bufferDataElement(new Uint32Array([
        0, 1, 3,  // first Triangle
        1, 2, 3   // second Triangle
    ]));
    setVertexAttributePointer(0, 3, false, 8, 0);
    enableVertexAttribute(0);
    setVertexAttributePointer(1, 3, false, 8, 3);
    enableVertexAttribute(1);
    setVertexAttributePointer(2, 2, false, 8, 6);
    enableVertexAttribute(2);

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
/**
 * 
 * @param {string} program 
 * @param {string} name 
 * @returns 
 */
function getUniformLocationCached(program, name) {

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
function getProgram(name) {
    if (programCache.has(name)) {
        return programCache.get(name);
    }
    throw new Error(`Program ${name} not found`);
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

    bindVAO(vaoTile);
    uniform1f(getUniformLocationCached(program, "u_time"), 0);
    activeTexture(0);
    bindTexture(texTile1);
    uniform1i(getUniformLocationCached(program, "u_texture1"), 0);
    activeTexture(1);
    bindTexture(texTile2);
    uniform1i(getUniformLocationCached(program, "u_texture2"), 1);
    for (let i = 0; i < character.mMap.mWidth; i++) {
        for (let j = 0; j < character.mMap.mHeight; j++) {
            if (!character.mMap.mTIlesSprites[j * character.mMap.mWidth + i].unit) continue;
            mat4.identity(m)
            mat4.translate(m, m, [...character.mMap.getMapTilePosition(i, j), 0]);
            uniformMatrix4fv(getUniformLocationCached(program, "u_model"), false, m);
            activeTexture(0);
            bindTexture(character.mMap.mTIlesSprites[j * character.mMap.mWidth + i].unit === TileType.Block ? texTile1 : texTile2);
            uniform1i(getUniformLocationCached(program, "u_texture1"), 0);
            activeTexture(1);
            bindTexture(texTile2);
            uniform1i(getUniformLocationCached(program, "u_texture2"), 1);
            drawElements(6);
        }
    }


    bindVAO(vaoMovingPlatform);
    for (let i = 0; i < mMovingPlatforms.length; ++i) {
        const character = mMovingPlatforms[i];
        character.mAlpha = alpha;
        mat4.identity(m)
        mat4.translate(m, m, [character.position[0], character.position[1], 0]);
        mat4.scale(m, m, [character.scale[0], character.scale[1], 1]);
        uniformMatrix4fv(getUniformLocationCached(program, "u_model"), false, m);
        uniform1f(getUniformLocationCached(program, "u_time"), 0);
        activeTexture(0);
        bindTexture(tex1);
        uniform1i(getUniformLocationCached(program, "u_texture1"), 0);
        activeTexture(1);
        bindTexture(tex2);
        uniform1i(getUniformLocationCached(program, "u_texture2"), 1);
        drawElements(6);
    }

    bindVAO(vao);
    const objects = [character].concat(mObjects);
    for (let i = 0; i < objects.length; ++i) {
        const character = objects[i];
        character.mAlpha = alpha;
        mat4.identity(m)
        mat4.translate(m, m, [character.position[0], character.position[1], 0]);
        mat4.scale(m, m, [character.scale[0], character.scale[1], 1]);
        uniformMatrix4fv(getUniformLocationCached(program, "u_model"), false, m);
        uniform1f(getUniformLocationCached(program, "u_time"), 0);
        activeTexture(0);
        bindTexture(tex1);
        uniform1i(getUniformLocationCached(program, "u_texture1"), 0);
        activeTexture(1);
        bindTexture(tex2);
        uniform1i(getUniformLocationCached(program, "u_texture2"), 1);
        drawElements(6);
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
export const programCache = new Map();
export const cacheUniformLocation = new Map();

