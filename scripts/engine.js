import { dummyWithBrainECS } from "./ecs/dummyWithBrainECS.js";
import { loadText, loadImage, initContext, clearColor, createShaderProgram, useProgram, createVAO, createBuffer, bindVAO, bindVBO, bufferData, bindEBO, bufferDataElement, setVertexAttributePointer, enableVertexAttribute, createTexture, activeTexture, bindTexture, updateTexture, mat4, resize, getScreenWidth, getScreenHeight, uniformMatrix4fv, getUniformLocation, uniform1f, getTime, uniform1i, clear, drawElements, pollEvents, shouldCloseWindow, swapBuffers, terminate, getKey } from "./libs.js";
import { cHalfSizeX, cHalfSizeY } from "./misc/constants.js";
import { KeyCode, KeyCodeGLFW, KeyInput } from "./misc/enums.js";
import { Character } from "./object/Character.js";



/** @type {WebGLProgram}*/
let program;

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


/** @type {EnumSet<typeof KeyInput>} */
const inputs = new Set();

/** @type {EnumSet<typeof KeyInput>} */
const prevInputs = new Set();

export async function load() {
    vertexShaderSource = await loadText("resources/glsl/demo.vert.sk");
    fragmentShaderSource = await loadText("resources/glsl/demo.frag.sk");
    image1 = await loadImage("resources/image/container.jpg");
    image2 = await loadImage("resources/image/awesomeface.png");
}
export function init() {
    initContext();
    character = new Character();
    character.characterInit(inputs, prevInputs);
    clearColor(0.5, 1, 0.5, 1.0);
    program = createShaderProgram(vertexShaderSource, fragmentShaderSource);
    useProgram(program);
    const vao = createVAO();
    const vbo = createBuffer();
    const ebo = createBuffer();
    bindVAO(vao);
    dummyWithBrainECS();
    const position = new Float32Array([
        cHalfSizeX, cHalfSizeY, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0,
        cHalfSizeX, -cHalfSizeY, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0,
        -cHalfSizeX, -cHalfSizeY, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0,
        -cHalfSizeX, cHalfSizeY, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0
    ]);
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

}
const m = mat4.create();
const zoom = 1;
/**
 * 
 * @param {number} delta 
 */
export function fixedUpdate(delta) {
    if (!program) throw new Error("Program not initialized");
    character.deltaTime = delta;
    character.characterUpdate();
    // updateecs();
}
export function render() {
    resize();
    clear();
    mat4.identity(m)
    mat4.ortho(m, 0, getScreenWidth(), 0, getScreenHeight(), 1, -1);
    uniformMatrix4fv(getUniformLocation(program, "u_projection"), false, m);
    mat4.identity(m);
    const viewOffset = [-getScreenWidth() / 2, -getScreenHeight() / 2];
    mat4.lookAt(m, [...viewOffset, 1], [...viewOffset, -1], [0, 1, 0]);
    uniformMatrix4fv(getUniformLocation(program, "u_view"), false, m);
    mat4.identity(m)
    mat4.scale(m, m, [zoom, zoom, 1]);
    uniformMatrix4fv(getUniformLocation(program, "u_world"), false, m);
    mat4.identity(m)
    mat4.translate(m, m, [character.position[0], character.position[1], 0]);
    uniformMatrix4fv(getUniformLocation(program, "u_model"), false, m);
    uniform1f(getUniformLocation(program, "u_time"), 0);
    bindTexture(tex1);
    uniform1i(getUniformLocation(program, "u_texture1"), 0);
    bindTexture(tex2);
    uniform1i(getUniformLocation(program, "u_texture2"), 1);
    drawElements(6);
    mat4.identity(m)
    mat4.translate(m, m, [0, -40, 0]);
    mat4.scale(m, m, [getScreenWidth(), 1, 1]);
    uniformMatrix4fv(getUniformLocation(program, "u_model"), false, m);
    uniform1f(getUniformLocation(program, "u_time"), 0);
    bindTexture(tex1);
    uniform1i(getUniformLocation(program, "u_texture1"), 0);
    bindTexture(tex2);
    uniform1i(getUniformLocation(program, "u_texture2"), 1);
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

