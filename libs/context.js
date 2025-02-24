"use strict";

/**
 * The context object.
 * @type {{
 *   gl: WebGL2RenderingContext
 * }}
 */
const context = {
    //@ts-ignore
    gl: null,

}
const keyset = new Set();
const vaos = new Set();
const vbos = new Set();
const GLSL_HEADER = `#version 300 es\nprecision highp float;`;

/**
 * Load text from a file.
 * @param {string} filename - The name of the file to load.
 * @returns {Promise<string>} The content of the file.
 */
export async function loadText(filename) {
    // Implementation of loadText
    return fetch(filename).then(response => response.text());
}

/**
 * Create a shader program.
 * @param {string} vertexShaderSource - The source code of the vertex shader.
 * @param {string} fragmentShaderSource - The source code of the fragment shader.
 * @returns {WebGLProgram} The shader program ID.
 */
export function createShaderProgram(vertexShaderSource, fragmentShaderSource) {
    // Implementation of createShaderProgram
    const gl = context.gl;
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    if (!vertexShader) {
        throw new Error("Failed to create vertex shader");
    }
    gl.shaderSource(vertexShader, GLSL_HEADER + vertexShaderSource);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(vertexShader) ?? "Failed to compile vertex shader");
    }

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    if (!fragmentShader) {
        throw new Error("Failed to create fragment shader");
    }
    gl.shaderSource(fragmentShader, GLSL_HEADER + fragmentShaderSource);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(fragmentShader) ?? "Failed to compile fragment shader");
    }

    const program = gl.createProgram();
    if (!program) {
        throw new Error("Failed to create shader program");
    }
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) ?? "Failed to link shader program");
    }

    return program;
}

/**
 * Buffer data to the GPU.
 * @param {ArrayBufferLike} buffer - The data to buffer.
 */
export function bufferData(buffer) {
    // Implementation of bufferData
    const gl = context.gl;
    gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.STATIC_DRAW);
}

/**
 * Buffer element data to the GPU.
 * @param {ArrayBufferLike} buffer - The data to buffer.
 */
export function bufferDataElement(buffer) {
    // Implementation of bufferData
    const gl = context.gl;
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, buffer, gl.STATIC_DRAW);
}

/**
 * Create a Vertex Array Object (VAO).
 * @returns {WebGLVertexArrayObject} The VAO ID.
 */
export function createVAO() {
    // Implementation of createVAO
    const gl = context.gl;
    const vao = gl.createVertexArray();
    if (!vao) {
        throw new Error("Failed to create VAO");
    }
    vaos.add(vao);
    return vao;
}

/**
 * Create a Vertex Buffer Object (VBO).
 * @returns {WebGLBuffer} The VBO ID.
 */
export function createBuffer() {
    // Implementation of createVBO
    const gl = context.gl;
    const vbo = gl.createBuffer();
    if (!vbo) {
        throw new Error("Failed to create VBO");
    }
    vbos.add(vbo);
    return vbo;
}

/**
 * Bind a Vertex Array Object (VAO).
 * @param {WebGLVertexArrayObject} vao - The VAO ID.
 */
export function bindVAO(vao) {
    // Implementation of bindVAO
    context.gl.bindVertexArray(vao);
}

/**
 * Bind a Vertex Buffer Object (VBO).
 * @param {WebGLBuffer} vbo - The VBO ID.
 */
export function bindVBO(vbo) {
    // Implementation of bindVBO
    context.gl.bindBuffer(context.gl.ARRAY_BUFFER, vbo);
}

/**
 * Bind an Element Buffer Object (EBO).
 * @param {WebGLBuffer} ebo - The EBO ID.
 */
export function bindEBO(ebo) {
    // Implementation of bindEBO
    context.gl.bindBuffer(context.gl.ELEMENT_ARRAY_BUFFER, ebo);
}
const SIZE_OF_FLOAT = 4;
/**
 * Set the vertex attribute pointer.
 * @param {number} index - The index of the generic vertex attribute.
 * @param {number} size - The number of components per vertex attribute.
 * @param {boolean} normalized - Whether fixed-point data values should be normalized.
 * @param {number} stride - The byte offset between consecutive vertex attributes.
 * @param {number} offset - The offset of the first component.
 */
export function setVertexAttributePointer(index, size, normalized, stride, offset) {
    // Implementation of setVertexAttributePointer

    context.gl.vertexAttribPointer(index, size, context.gl.FLOAT, normalized, stride * SIZE_OF_FLOAT, offset * SIZE_OF_FLOAT);
}

/**
 * Enable a vertex attribute array.
 * @param {number} index - The index of the generic vertex attribute to be enabled.
 */
export function enableVertexAttribute(index) {
    // Implementation of enableVertexAttribute

    context.gl.enableVertexAttribArray(index);
}

/**
 * Draw elements from array data.
 * @param {number} count - The number of elements to be rendered.
 */
export function drawElements(count) {
    // Implementation of drawElements
    const gl = context.gl
    gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_INT, 0);
}

/**
 * Use a shader program.
 * @param {WebGLProgram} program - The shader program ID.
 */
export function useProgram(program) {
    // Implementation of useProgram

    context.gl.useProgram(program);
}

/**
 * 
 * @param {WebGLProgram} program 
 * @param {string} name 
 * @returns {WebGLUniformLocation}
 */
export function getUniformLocation(program, name) {
    const loc = context.gl.getUniformLocation(program, name);
    if (!loc) {
        throw new Error(`Failed to get uniform location for ${name}`);
    }
    return loc;
}


/**
 * Sets the value of a uniform variable for the current WebGL program.
 *
 * @param {WebGLUniformLocation} location - The location of the uniform variable to be set.
 * @param {number} value - The new value to be set for the uniform variable.
 */
export function uniform1f(location, value) {
    context.gl.uniform1f(location, value);
}

/**
 * Sets a 4x4 matrix uniform in a WebGL program.
 *
 * @param {WebGLUniformLocation} location - The location of the uniform variable to be set.
 * @param {boolean} transpose - Whether to transpose the matrix. Must be false.
 * @param {Float32List} value - The matrix data to be set.
 */
export function uniformMatrix4fv(location, transpose, value) {
    context.gl.uniformMatrix4fv(location, transpose, value);
}


/**
 * Sets the value of a uniform variable for the current WebGL program.
 *
 * @param {WebGLUniformLocation} location - The location of the uniform variable to be set.
 * @param {number} v0 - The new value to be set for the uniform variable.
 * @param {number} v1 - The new value to be set for the uniform variable.
 * @param {number} v2 - The new value to be set for the uniform variable.
 */
export function uniform3f(location, v0, v1, v2) {
    context.gl.uniform3f(location, v0, v1, v2);
}

/**
 * Sets the value of a uniform variable for the current WebGL program.
 *
 * @param {WebGLUniformLocation} location - The location of the uniform variable to be set.
 * @param {number} v0 - The new value to be set for the uniform variable.
 * @param {number} v1 - The new value to be set for the uniform variable.
 * @param {number} v2 - The new value to be set for the uniform variable.
 * @param {number} v3 - The new value to be set for the uniform variable.
 */
export function uniform4f(location, v0, v1, v2, v3) {
    context.gl.uniform4f(location, v0, v1, v2, v3);
}

/**
 * Sets the value of a uniform variable for the current WebGL program.
 *
 * @param {WebGLUniformLocation} location - The location of the uniform variable to be set.
 * @param {number} value - The new value to be set for the uniform variable.
 */
export function uniform1i(location, value) {
    context.gl.uniform1i(location, value);
}

/**
 * Clear buffers to preset values.
 */
export function clear() {
    // Implementation of clear

    context.gl.clear(context.gl.COLOR_BUFFER_BIT);
}
/**
 * Set the clear color.
 * @param {number} r
 * @param {number} g 
 * @param {number} b 
 * @param {number} a 
 */
export function clearColor(r, g, b, a) {
    // Implementation of clearColor

    context.gl.clearColor(r, g, b, a);
}

/**
 * Set the viewport.
 * @param {number} x - The lower left corner of the viewport rectangle, in pixels.
 * @param {number} y - The lower left corner of the viewport rectangle, in pixels.
 * @param {number} width - The width of the viewport.
 * @param {number} height - The height of the viewport.
 */
export function viewport(x, y, width, height) {
    // Implementation of viewport
    context.gl.viewport(x, y, width, height);

}

/**
 * Check if the window should close.
 * @returns {boolean} True if the window should close, false otherwise.
 */
export function shouldCloseWindow() {
    // Implementation of shouldCloseWindow
    return false;
}

/**
 * Swap the front and back buffers.
 */
export function swapBuffers() {
    // Implementation of swapBuffers
}

/**
 * Poll for and process events.
 */
export function pollEvents() {
    // Implementation of pollEvents
    keyset.clear();
}

/**
 * Get the current time.
 * @returns {number} The current time in seconds.
 */
export function getTime() {
    // Implementation of getTime
    return performance.now() / 1000; // Return the current time in seconds
}
/**
 * 
 * @param {number} keyCode 
 * @returns {boolean}
 */
export function getKey(keyCode) {
    return keyset.has(keyCode);
}
/**
 * Initialize the library.
 */
export function initContext() {
    // Implementation of init
    document.addEventListener("keydown", (event) => {
        keyset.add(event.keyCode);
    });
    document.addEventListener("keyup", (event) => {
        keyset.delete(event.keyCode);
    });

    /**
     * @type {HTMLCanvasElement | null}
     */
    const canvas = document.querySelector("#c");
    const gl = canvas?.getContext("webgl2");
    if (!gl) {
        throw new Error("WebGL2 is not supported");
    }
    context.gl = gl;
    gl.canvas.width = getScreenWidth();
    gl.canvas.height = getScreenHeight();
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}

/**
 * Terminate the library.
 */
export function terminate() {
    // Implementation of terminate
}

/**
 * Get the screen width.
 * @returns {number} The screen width.
 */
export function getScreenWidth() {
    return window.innerWidth; // Return the screen width
}

/**
 * Get the screen height.
 * @returns {number} The screen height.
 */
export function getScreenHeight() {
    return window.innerHeight; // Return the screen height
}

export function resize() {
    const gl = context.gl;
    const canvas = gl.canvas;
    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
    }
}
/**
 * 
 * @param {string} url 
 * @returns {Promise<ImageContainer>}
 */
export async function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({
            width: img.width,
            height: img.height,
            data: img
        });
        img.onerror = reject;
        img.src = url;
    });
}
/**
 * 
 * @returns {WebGLTexture}
 */
export function createTexture() {
    const gl = context.gl;
    const texture = gl.createTexture();
    if (!texture) {
        throw new Error("Failed to create texture");
    }
    return texture;
}
/**
 * 
 * @param {WebGLTexture} texture 
 */
export function bindTexture(texture) {
    const gl = context.gl;
    gl.bindTexture(gl.TEXTURE_2D, texture);
}

/**
 * 
 * @param {ImageContainer} image 
 */
export function updateTexture(image) {
    const gl = context.gl;
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image.data);
    gl.generateMipmap(gl.TEXTURE_2D);
}
/**
 * 
 * @param {number} unit 
 */
export function activeTexture(unit) {
    const gl = context.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
}