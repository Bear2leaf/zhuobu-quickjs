import { dummyWithBrainECS } from "./ecs/dummyWithBrainECS.js";
import { loadText, loadImage, initContext, clearColor, createShaderProgram, useProgram, createVAO, createBuffer, bindVAO, bindVBO, bufferData, bindEBO, bufferDataElement, setVertexAttributePointer, enableVertexAttribute, createTexture, activeTexture, bindTexture, updateTexture, mat4, resize, getScreenWidth, getScreenHeight, uniformMatrix4fv, getUniformLocation, uniform1f, getTime, uniform1i, clear, drawElements } from "./libs.js";



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



export async function load() {
    vertexShaderSource = await loadText("resources/glsl/demo.vert.sk");
    fragmentShaderSource = await loadText("resources/glsl/demo.frag.sk");
    image1 = await loadImage("resources/image/container.jpg");
    image2 = await loadImage("resources/image/awesomeface.png");
}

export function init() {
    initContext();
    clearColor(0.5, 1, 0.5, 1.0);
    program = createShaderProgram(vertexShaderSource, fragmentShaderSource);
    useProgram(program);
    const vao = createVAO();
    const vbo = createBuffer();
    const ebo = createBuffer();
    bindVAO(vao);
    dummyWithBrainECS();
    const position = new Float32Array([
        8, 8, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0,
        8, -8, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0,
        -8, -8, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0,
        -8, 8, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0
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
const zoom = 10;
export function update() {
    if (!program) throw new Error("Program not initialized");
    resize();
    // updateecs();
    mat4.identity(m)
    mat4.ortho(m, 0, getScreenWidth(), getScreenHeight(), 0, -1, 1);
    uniformMatrix4fv(getUniformLocation(program, "u_projection"), false, m);
    mat4.identity(m);
    const viewOffset = [-getScreenWidth() / 2, -getScreenHeight() / 2];
    mat4.lookAt(m, [...viewOffset, 1], [...viewOffset, 0], [0, 1, 0]);
    uniformMatrix4fv(getUniformLocation(program, "u_view"), false, m);
    mat4.identity(m)
    mat4.scale(m, m, [zoom, zoom, 1]);
    uniformMatrix4fv(getUniformLocation(program, "u_model"), false, m);
    uniform1f(getUniformLocation(program, "u_time"), getTime());
    bindTexture(tex1);
    uniform1i(getUniformLocation(program, "u_texture1"), 0);
    bindTexture(tex2);
    uniform1i(getUniformLocation(program, "u_texture2"), 1);
}
export function render() {
    clear();
    drawElements(6);
}
