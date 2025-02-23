import { clearColor, clear, createShaderProgram, useProgram, createBuffer, bindVBO, bufferData, createVAO, bindVAO, bindEBO, setVertexAttributePointer, enableVertexAttribute, drawElements, bufferDataElement, getUniformLocation, uniformMatrix4fv, getTime, uniform1f, uniform4f, loadText, loadImage, uniform1i, createTexture, bindTexture, updateTexture, initContext, activeTexture } from "../libs/context.so";
import { mat4 } from "../libs/gl-matrix/index.js";


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

    const position = new Float32Array([
        0.5, 0.5, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0,
        0.5, -0.5, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0,
        -0.5, -0.5, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0,
        -0.5, 0.5, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0
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
export function update() {
    if (!program) throw new Error("Program not initialized");
    mat4.identity(m)
    uniformMatrix4fv(getUniformLocation(program, "u_model"), false, m);
    uniformMatrix4fv(getUniformLocation(program, "u_view"), false, m);
    uniformMatrix4fv(getUniformLocation(program, "u_projection"), false, m);
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
