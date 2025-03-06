import { getProgram, getUniformLocationCached } from "../engine.js";
import { activeTexture, bindEBO, bindTexture, bindVAO, bindVBO, bufferData, bufferDataElement, createBuffer, createTexture, createVAO, drawElements, enableVertexAttribute, getScreenHeight, getScreenWidth, mat4, setVertexAttributePointer, uniform1i, uniform3f, uniform4f, uniformMatrix4fv, updateTexture, useProgram } from "../libs.js";
import { MTSDFText } from "../object/MTSDFText.js";
/** @type {Record<string, MTSDFText>} */
const mtsdfTexts = {}
/**
 * 
 * @param {string} content 
 * @param {TextOptions["font"]} fontData 
 * @param {number} size 
 * @param {"left" | "right" | "center"} align 
 * @param {number} width 
 * @returns {MTSDFText}
 */
function cacheMTSDFText(content, fontData, size, align, width) {
    const key = `${content}_${size}_${align}_${width}`;
    if (mtsdfTexts[key] === undefined) {
        mtsdfTexts[key] = new MTSDFText({ font: fontData, text: content, size, align, width, wordBreak: true });
    }
    return mtsdfTexts[key];
}

export class TextRenderer {
    constructor() {
        /** @type {WebGLTexture[]} */
        this.textures = [];
        this.program = "text"
    }
    /**
     * 
     * @param {ImageContainer[]} imgs 
     */
    initImageTexture(...imgs) {
        for (let index = 0; index < imgs.length; index++) {
            const img = imgs[index];
            const tex = createTexture();
            activeTexture(index);
            bindTexture(tex);
            updateTexture(img);
            /** @type {[number, number, number]} */
            this.unitRange = [img.width , img.height , 0];
            this.textures.push(tex);
        }
    }
    /**
     * 
     * @param {TextOptions["font"]} font 
     */
    setFont(font) {
        this.font = font;
    }
    initText() {
        this.vao = createVAO();
        this.vboPositions = createBuffer();
        this.vboTexcoords = createBuffer();
        this.ebo = createBuffer();
        const { vao, vboPositions, vboTexcoords, ebo, program, textures, font } = this;
        if (!font) {
            throw new Error("Font not initialized");
        }
        const mtsdfText = cacheMTSDFText("Hello", font, 24, "left", Infinity);
        const positions = mtsdfText.buffers.position;
        const texcoords = mtsdfText.buffers.uv;
        const indices = mtsdfText.buffers.index;
        bindVAO(vao);
        bindVBO(vboPositions);
        bufferData(positions);
        setVertexAttributePointer(0, 3, false, 3, 0);
        enableVertexAttribute(0);
        bindEBO(ebo);
        bufferDataElement(indices);
        bindVBO(vboTexcoords);
        bufferData(texcoords);
        setVertexAttributePointer(1, 2, false, 2, 0);
        enableVertexAttribute(1);
        this.count = indices.length;
    }
    /**
     * 
     * @param {string} text 
     */
    updateText(text) {
        const { vao, vboPositions, vboTexcoords, ebo, program, textures, font } = this;
        if (!font) {
            throw new Error("Font not initialized");
        }
        if (!vao) {
            throw new Error("VAO not initialized");
        }
        if (!ebo) {
            throw new Error("EBO not initialized");
        }
        if (!vboPositions) {
            throw new Error("VBO not initialized");
        }
        if (!vboTexcoords) {
            throw new Error("VBO not initialized");
        }
        const mtsdfText = cacheMTSDFText(text, font, 24, "left", Infinity);
        const positions = mtsdfText.buffers.position;
        const texcoords = mtsdfText.buffers.uv;
        const indices = mtsdfText.buffers.index;
        bindVAO(vao);
        bindVBO(vboPositions);
        bufferData(positions);
        bindVBO(vboTexcoords);
        bufferData(texcoords);
        bindEBO(ebo);
        bufferDataElement(indices);
        this.count = indices.length;
    }
    render() {
        const { vao, program, textures, unitRange } = this;
        if (!vao) {
            throw new Error("VAO not initialized");
        }
        if (!unitRange) {
            throw new Error("unitRange not initialized");
        }
        useProgram(getProgram(program));
        bindVAO(vao);
        uniformMatrix4fv(getUniformLocationCached(program, "u_projection"), false, mat4.ortho(m, 0, getScreenWidth(), getScreenHeight(), 0, -1, 1));
        uniformMatrix4fv(getUniformLocationCached(program, "u_modelView"), false, mat4.multiply(m, mat4.identity(m), mat4.fromTranslation(m, [0, 0, 0])));
        uniform3f(getUniformLocationCached(program, "u_unitRange"), ...unitRange);
        uniform4f(getUniformLocationCached(program, "u_color"), 0, 0, 0, 1);
        for (let index = 0; index < textures.length; index++) {
            const element = textures[index];
            activeTexture(index);
            bindTexture(element);
            uniform1i(getUniformLocationCached(program, `u_texture${index}`), index);
        }
        if (this.count) {
            drawElements(0, this.count);
        }
    }
}


const m = mat4.create();