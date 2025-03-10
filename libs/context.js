"use strict";


/**
 * The context object.
 * @type {{
 *   gl: WebGL2RenderingContext,
 *   audio: AudioContext
 * }}
 */
const context = {
    // @ts-ignore
    gl: null,
    audio: new AudioContext()
}
const keyset = new Set();
const vaos = new Set();
const vbos = new Set();
const GLSL_HEADER = `#version 300 es\nprecision highp float;`;

const MAX_AUDIO = 4;
/**
 * @type {{filename: string, buffer: unknown}[]}
 */
const audiobuffers = [];
const audioNodes = new Array(MAX_AUDIO);

/**
 * 
 * @param {string} filename 
 * @returns {Promise<number>}
 */
export async function loadAudio(filename) {
    return new Promise((resolve, reject) => {
        const audio = audiobuffers.find(audio => audio.filename === filename);
        if (audio) {
            resolve(audiobuffers.indexOf(audio));
        } else {
            fetch(filename).then(response => response.arrayBuffer()).then(buffer => {
                context.audio.decodeAudioData(buffer, (audioBuffer) => {
                    audiobuffers.push({
                        filename,
                        buffer: audioBuffer
                    });
                    resolve(audiobuffers.length - 1);
                }, (error) => {
                    throw new Error(`Failed to decode audio data: ${filename}`);
                });
            })
        }
    })
}
/**
 * 
 * @param {number} id 
 * @param {number} volume 
 * @param {boolean} loop 
 */
export function playAudio(id, volume, loop) {
    const buffer = audiobuffers[id].buffer;
    if (!buffer) {
        throw new Error(`Failed to get audio buffer: ${id}`);
    }
    const source = context.audio.createBufferSource();
    source.buffer = buffer;
    source.loop = loop;
    const gain = context.audio.createGain();
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(context.audio.destination);
    source.start();
    audioNodes[id] = source;
}
/**
 * 
 * @param {number} id 
 */
export function stopAudio(id) {
    if (id >= MAX_AUDIO) {
        throw new Error(`Invalid audio id: ${id}`);
    }
    audioNodes[id].stop();
}

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
 * @param {number} offset - The starting offset in the array.
 * @param {number} count - The number of elements to be rendered.
 */
export function drawElements(offset, count) {
    // Implementation of drawElements
    const gl = context.gl
    gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_INT, offset * 4);
}

/**
 * Use a shader program.
 * @param {WebGLProgram} program - The shader program.
 */
export function useProgram(program) {
    context.gl.useProgram(program);
}
/**
 * 
 * @param {WebGLProgram} program 
 * @param {string} name 
 * @returns {WebGLUniformLocation}
 */
export function getUniformLocation(program, name) {
    const location = context.gl.getUniformLocation(program, name);
    if (!location) {
        throw new Error(`Failed to get uniform location for ${name}`);
    }
    return location;
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
    const scale = window.devicePixelRatio;
    gl.canvas.width = getScreenWidth() * scale;
    gl.canvas.height = getScreenHeight() * scale;
    gl.viewport(0, 0, gl.canvas.width / scale, gl.canvas.height / scale);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    /** @type {Readonly<[PointerData, PointerData]>} */
    const dualPointer = [{
        x: 0,
        y: 0,
        id: 0,
    }, {
        x: 0,
        y: 0,
        id: 0,
    }]
    /**
     * 
     * @param {PointerEvent} e 
     */
    function assignPointer(e) {
        if (!dualPointer[0].id) {
            dualPointer[0].id = e.pointerId;
            dualPointer[0].x = e.pageX;
            dualPointer[0].y = e.pageY;

        } else if (!dualPointer[1].id) {
            dualPointer[1].id = e.pointerId;
            dualPointer[1].x = e.pageX;
            dualPointer[1].y = e.pageY;
        }
    }
    /**
     *  
     * @param {PointerEvent} e
     */
    function clearPointer(e) {
        dualPointer.forEach((pointer, isSecondary) => {
            if (pointer.id === e.pointerId) {
                pointer.id = 0;
                pointer.x = 0;
                pointer.y = 0;
                if (!isSecondary) {
                    keyset.delete(39);
                    keyset.delete(37);
                    keyset.delete(40);
                    keyset.delete(32);
                } else {
                    keyset.delete(77);
                }
            }
        });
    }
    /**
     *  
     * @param {PointerEvent} e
     */
    function updatePointer(e) {
        dualPointer.forEach((pointer, isSecondary) => {
            if (pointer.id === e.pointerId) {
                if (!isSecondary) {
                    if (pointer.x - e.pageX < -50) {
                        keyset.add(39);
                        keyset.delete(37);
                    } else if (pointer.x - e.pageX > 50) {
                        keyset.add(37);
                        keyset.delete(39);
                    } else {
                        keyset.delete(39);
                        keyset.delete(37);
                    }
                    if (pointer.y - e.pageY < -100) {
                        keyset.add(40);
                        keyset.delete(32);
                    } else if (pointer.y - e.pageY > 100) {
                        keyset.add(32);
                        keyset.delete(40);
                    } else {
                        keyset.delete(40);
                        keyset.delete(32);
                    }
                } else {
                    keyset.add(77);
                }
            }
        });
    }
    document.addEventListener("pointerdown", (event) => {
        if (event.pointerType !== "touch") {
            return
        }
        assignPointer(event);
    });
    document.addEventListener("pointerup", (event) => {
        if (event.pointerType !== "touch") {
            return
        }
        clearPointer(event);
    });
    document.addEventListener("pointerleave", (event) => {
        if (event.pointerType !== "touch") {
            return
        }
        clearPointer(event);
    });
    document.addEventListener("pointermove", (event) => {
        if (event.pointerType !== "touch") {
            return
        }
        updatePointer(event);
    });
    document.addEventListener("contextmenu", (event) => {
        event.preventDefault();
    });


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
        const scale = window.devicePixelRatio;
        gl.canvas.width = getScreenWidth() * scale;
        gl.canvas.height = getScreenHeight() * scale;
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
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
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


/**
 * 
 * @param {number} width 
 * @param {number} height 
 * @returns {Framebuffer}
 */
export function createFramebuffer(width, height) {
    const { gl } = context;
    const fbo = gl.createFramebuffer();
    if (!fbo) throw new Error("createFramebuffer failed");
    const texture = gl.createTexture();
    if (!texture) throw new Error("createTexture failed");
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { fbo, texture, width, height };
}
/**
 * 
 * @param {Framebuffer} framebuffer 
 */
export function beginFramebuffer(framebuffer) {
    const { gl } = context;
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer.fbo);
    gl.viewport(0, 0, framebuffer.width, framebuffer.height);
    gl.scissor(0, 0, framebuffer.width, framebuffer.height);
}
export function endFramebuffer() {
    const { gl } = context;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    gl.viewport(0, 0, getScreenWidth(), getScreenHeight());
    gl.scissor(0, 0, getScreenWidth(), getScreenHeight());
}