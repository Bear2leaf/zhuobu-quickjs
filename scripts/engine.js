import { dummyWithBrainECS } from "./ecs/dummyWithBrainECS.js";
import { loadText, loadImage, initContext, clearColor, createShaderProgram, useProgram, createVAO, createBuffer, bindVAO, bindVBO, bufferData, bindEBO, bufferDataElement, setVertexAttributePointer, enableVertexAttribute, createTexture, activeTexture, bindTexture, updateTexture, mat4, resize, getScreenWidth, getScreenHeight, uniformMatrix4fv, getUniformLocation, uniform1f, getTime, uniform1i, clear, drawElements, pollEvents, shouldCloseWindow, swapBuffers, terminate, getKey } from "./libs.js";
import { cHalfSizeX, cHalfSizeY, cTileSize } from "./misc/constants.js";
import { KeyCode, KeyCodeGLFW, KeyInput, TileType } from "./misc/enums.js";
import { Character } from "./object/Character.js";



/** @type {WebGLVertexArrayObject} */
let vao;
/** @type {WebGLVertexArrayObject} */
let vaoTile;


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
/** @type {Character} */
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
    imageTile2 = await loadImage("resources/image/awesomeface.png");
}

const position = new Float32Array([
    cHalfSizeX * 2, cHalfSizeY * 2, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0,
    cHalfSizeX * 2, 0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0,
    0, 0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0,
    0, cHalfSizeY * 2, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0
]);
const positionTile = new Float32Array([
    +cTileSize / 2, +cTileSize / 2, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0,
    +cTileSize / 2, -cTileSize / 2, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0,
    -cTileSize / 2, -cTileSize / 2, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0,
    -cTileSize / 2, +cTileSize / 2, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0
]);
export function init() {
    initContext();
    character = new Character();
    character.characterInit(inputs, prevInputs);
    clearColor(0.5, 1, 0.5, 1.0);
    const program = createShaderProgram(vertexShaderSource, fragmentShaderSource);
    programCache.set("demo", program);
    useProgram(program);
    vao = createVAO();
    const vbo = createBuffer();
    const ebo = createBuffer();
    bindVAO(vao);
    dummyWithBrainECS();
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
    updateTexture(imageTile2);

}
const m = mat4.create();
const zoom = 1;
/**
 * 
 * @param {number} delta 
 */
export function fixedUpdate(delta) {
    character.deltaTime = delta;
    character.characterUpdate();
    // updateecs();
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
export function render() {
    resize();
    clear();
    const program= "demo";
    useProgram(getProgram(program));
    mat4.identity(m)
    mat4.ortho(m, 0, getScreenWidth(), 0, getScreenHeight(), 1, -1);
    uniformMatrix4fv(getUniformLocationCached(program, "u_projection"), false, m);
    mat4.identity(m);
    const viewOffset = [0, 0];
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
            if (character.mMap.mTIlesSprites[j * character.mMap.mWidth + i] === null) continue;
            mat4.identity(m)
            mat4.translate(m, m, [...character.mMap.getMapTilePosition(i, j), 0]);
            uniformMatrix4fv(getUniformLocationCached(program, "u_model"), false, m);
            drawElements(6);
        }
    }


    bindVAO(vao);
    mat4.identity(m)
    mat4.translate(m, m, [character.position[0], character.position[1], 0]);
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
}
let lastTime = getTime();
export async function mainQuickjs() {
    keys = KeyCodeGLFW;
    await load();
    init();
    let acc = 0;
    do {
        const currentTime = getTime();
        const delta = currentTime - lastTime;
        acc += delta;
        lastTime = currentTime;
        update();
        while (acc >= 1 / FPS) {
            fixedUpdate(acc);
            acc -= 1 / FPS;
        }
        render();
        swapBuffers();
        pollEvents();
    } while (!shouldCloseWindow());
    terminate();
}
export async function main() {
    keys = KeyCode;
    await load();
    init();
    function loop() {
        const currentTime = getTime();
        const delta = currentTime - lastTime;
        lastTime = currentTime;
        update();
        fixedUpdate(delta);
        render();
        requestAnimationFrame(loop);
    }
    loop();

}
export const FPS = 60;
export const programCache = new Map();
export const cacheUniformLocation = new Map();

