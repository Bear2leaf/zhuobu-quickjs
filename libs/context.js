"use strict";

import { mat4, vec2, vec3, vec4 } from "./gl-matrix/index.js";

const vertexShaderSource = `#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec4 a_position;
uniform mat4 u_projection;
uniform mat4 u_modelView;

// all shaders have a main function
void main() {

  // gl_Position is a special variable a vertex shader
  // is responsible for setting
  gl_Position = u_projection * u_modelView * a_position;
}
`;

const fragmentShaderSource = `#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

uniform vec4 u_color;
// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
  // Just set the output to a constant redish-purple
  outColor = u_color;
}
`;
/**
 * 
 * @param {WebGL2RenderingContext} gl 
 * @param {number} type 
 * @param {string} source 
 * @returns 
 */
function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    if (!shader) {
        throw new Error("Failed to create shader");
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }

    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    throw new Error("Failed to compile shader");
}
/**
 * 
 * @param {WebGL2RenderingContext} gl 
 * @param {WebGLShader} vertexShader 
 * @param {WebGLShader} fragmentShader 
 * @returns 
 */
function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }

    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    throw new Error("Failed to link program");
}
/**
 * @type {{
 * gl: WebGL2RenderingContext | null,
 * program: WebGLProgram | null,
 * positionAttributeLocation: number | null,
 * positionBuffer: WebGLBuffer | null,
 * projectionUniformLocation: WebGLUniformLocation | null,
 * modelViewUniformLocation: WebGLUniformLocation | null
 * colorUniformLocation: WebGLUniformLocation | null,
 * vao: WebGLVertexArrayObject | null,
 * }}
 */
const context = {
    gl: null,
    program: null,
    positionAttributeLocation: null,
    positionBuffer: null,
    projectionUniformLocation: null,
    modelViewUniformLocation: null,
    colorUniformLocation: null,
    vao: null,
};

export function getScreenWidth() {
    const { gl } = context;
    if (!gl) {
        throw new Error("Context is not initialized");
    }
    return gl.canvas.width;
}
export function getScreenHeight() {
    const { gl } = context;
    if (!gl) {
        throw new Error("Context is not initialized");
    }
    return gl.canvas.height;
}
export function initContext() {
    // Get A WebGL context
    /**
     * @type {HTMLCanvasElement | null}
     */
    const canvas = document.querySelector("#c");
    const gl = canvas?.getContext("webgl2");
    if (!gl) {
        throw new Error("WebGL2 is not supported");
    }

    // create GLSL shaders, upload the GLSL source, compile the shaders
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    // Link the two shaders into a program
    const program = createProgram(gl, vertexShader, fragmentShader);

    // look up where the vertex data needs to go.
    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");

    // Create a buffer and put three 2d clip space points in it
    const positionBuffer = gl.createBuffer();

    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const positions = [
        0, 0,
        0, 8,
        8, 8,
        8, 8,
        8, 0,
        0, 0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Create a vertex array object (attribute state)
    const vao = gl.createVertexArray();

    // and make it the one we're currently working with
    gl.bindVertexArray(vao);

    // Turn on the attribute
    gl.enableVertexAttribArray(positionAttributeLocation);

    {
        // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        const size = 2;          // 2 components per iteration
        const type = gl.FLOAT;   // the data is 32bit floats
        const normalize = false; // don't normalize the data
        const stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        const offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(
            positionAttributeLocation, size, type, normalize, stride, offset);
    }

    context.gl = gl;
    context.program = program;
    context.positionAttributeLocation = positionAttributeLocation;
    context.positionBuffer = positionBuffer;
    context.projectionUniformLocation = gl.getUniformLocation(program, "u_projection");
    context.modelViewUniformLocation = gl.getUniformLocation(program, "u_modelView");
    context.colorUniformLocation = gl.getUniformLocation(program, "u_color");
    context.vao = vao;

}

const color = vec4.create();
const camera = vec3.create();
const modelViewMatrix = mat4.create();
const projectionMatrix = mat4.create();

// export function tick() {
//     const { gl, program, positionAttributeLocation, positionBuffer, vao } = context;
//     if (!gl || !program || positionAttributeLocation === null || !positionBuffer || !vao) {
//         throw new Error("Context is not initialized");
//     }

//     // resize canvas
//     resizeCanvasToDisplaySize(gl.canvas);

//     // Tell WebGL how to convert from clip space to pixels
//     gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

//     gl.clear(gl.COLOR_BUFFER_BIT);

//     // Tell it to use our program (pair of shaders)
//     gl.useProgram(program);

//     // Bind the attribute/buffer set we want.
//     gl.bindVertexArray(vao);
//     const left = 0;
//     const right = gl.canvas.width;
//     const bottom = gl.canvas.height;
//     const top = 0;
//     const near = -1;
//     const far = 1;
//     mat4.ortho(projectionMatrix, left, right, bottom, top, near, far);
//     gl.uniformMatrix4fv(context.projectionUniformLocation, false, projectionMatrix);
//     vec3.set(camera, gl.canvas.width / 2, gl.canvas.height / 2, 0);
//     for (let i = 0; i < 10; i++) {
//         // rainbow colors
//         vec4.set(color, Math.sin(performance.now() / 1000 + Math.PI / 4 * i) / 2 + 0.5, Math.sin(performance.now() / 1000 + Math.PI / 4 * i + 2 * Math.PI / 3) / 2 + 0.5, Math.sin(performance.now() / 1000 + Math.PI / 4 * i + 4 * Math.PI / 3) / 2 + 0.5, 1);
//         drawSquare(camera, performance.now() / 1000 + Math.PI / 4 * i / 1.5, vec3.fromValues(20, 20, 1), color);
//     }
// }
/**
 * 
 * @param {vec3} position 
 * @param {number} rotation 
 * @param {vec3} scale
 * @param {vec4} color
 */
export function drawSquare(position, rotation, scale, color) {
    const { gl, program, positionAttributeLocation, positionBuffer, vao } = context;
    if (!gl || !program || positionAttributeLocation === null || !positionBuffer || !vao) {
        throw new Error("Context is not initialized");
    }
    mat4.identity(modelViewMatrix);
    mat4.translate(modelViewMatrix, modelViewMatrix, position);
    mat4.rotateZ(modelViewMatrix, modelViewMatrix, rotation);
    mat4.scale(modelViewMatrix, modelViewMatrix, scale);
    gl.uniformMatrix4fv(context.modelViewUniformLocation, false, modelViewMatrix);
    gl.uniform4fv(context.colorUniformLocation, color);
    const primitiveType = gl.TRIANGLES;
    const offset = 0;
    const count = 6;
    gl.drawArrays(primitiveType, offset, count);
}

export function uninitContext() {

}
export function shouldClose() {
    return false;
}
/**
 * 
 * @param {number} r 
 * @param {number} g 
 * @param {number} b 
 * @param {number} a 
 */
export function setClearColor(r, g, b, a) {
    const { gl } = context;
    if (!gl) {
        throw new Error("Context is not initialized");
    }
    gl.clearColor(r, g, b, a);
}

export function beginFrame() {
    const { gl, program, positionAttributeLocation, positionBuffer, vao } = context;
    if (!gl || !program || positionAttributeLocation === null || !positionBuffer || !vao) {
        throw new Error("Context is not initialized");
    }

    // resize canvas
    resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clear(gl.COLOR_BUFFER_BIT);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // Bind the attribute/buffer set we want.
    gl.bindVertexArray(vao);
    const left = 0;
    const right = gl.canvas.width;
    const bottom = gl.canvas.height;
    const top = 0;
    const near = -1;
    const far = 1;
    mat4.ortho(projectionMatrix, left, right, bottom, top, near, far);
    gl.uniformMatrix4fv(context.projectionUniformLocation, false, projectionMatrix);
    vec3.set(camera, gl.canvas.width / 2, gl.canvas.height / 2, 0);
}
export function endFrame() {
    const { gl } = context;
    if (!gl) {
        throw new Error("Context is not initialized");
    }
}
export function now() {
    return performance.now();
}
/**
 * 
 * @param {HTMLCanvasElement | OffscreenCanvas} canvas 
 */
function resizeCanvasToDisplaySize(canvas) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
    }
}