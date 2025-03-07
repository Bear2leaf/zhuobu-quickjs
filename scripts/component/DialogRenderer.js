import { getProgram, getUniformLocationCached } from "../engine.js";
import { activeTexture, bindEBO, bindTexture, bindVAO, bindVBO, bufferData, bufferDataElement, createBuffer, createTexture, createVAO, drawElements, enableVertexAttribute, getKey, getScreenHeight, getScreenWidth, ink, mat4, setVertexAttributePointer, uniform1i, uniform3f, uniform4f, uniformMatrix4fv, updateTexture, useProgram } from "../libs.js";
import { KeyInput } from "../misc/enums.js";
import { MTSDFText } from "../object/MTSDFText.js";

/**
 * Creates a new Arraybuffer based on two different ArrayBuffers
 *
 * @param {ArrayBuffer} buffer1 The first buffer.
 * @param {ArrayBuffer} buffer2 The second buffer.
 * @return {ArrayBuffer} The new ArrayBuffer created out of the two.
 */
function appendBuffer(buffer1, buffer2) {
    const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
    tmp.set(new Uint8Array(buffer1), 0);
    tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
    return tmp.buffer;
};

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

export class DialogRenderer {
    constructor() {
        /** @type {WebGLTexture[]} */
        this.textures = [];
        this.program = "text"
        this.messages = ["Hello World"];
        /**
         * @type {{text: string, offset: number, count: number}[]}
         */
        this.choices = [];
        this.compiler = new ink.Compiler("");
        this.count = 0;
        this.selection = -1;
    }
    /**
     * 
     * @param {string} storySource 
     */
    initStory(storySource) {
        const compiler = new ink.Compiler(storySource);
        const story = this.story = compiler.Compile();
        this.updateStory();
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
            this.unitRange = [img.width, img.height, 0];
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
        const mtsdfText = cacheMTSDFText("Hello", font, 24, "left", getScreenWidth());
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
     * @param {EnumSet<typeof KeyInput>} inputs 
     * @param {EnumSet<typeof KeyInput>} prevInputs 
     **/
    updateSelection(inputs, prevInputs) {
        const next = inputs.has(KeyInput.GoDown) && !prevInputs.has(KeyInput.GoDown);
        const prev = inputs.has(KeyInput.Up) && !prevInputs.has(KeyInput.Up);
        const confirm = inputs.has(KeyInput.Jump) && !prevInputs.has(KeyInput.Jump);
        if (next) {
            this.selection++;
            if (this.selection >= this.choices.length) {
                this.selection = 0;
            }
        } else if (prev) {
            this.selection--;
            if (this.selection < 0) {
                this.selection = this.choices.length - 1;
            }
        } else if (confirm) {
            this.select();
        }
    }
    select() {
        const story = this.story;
        if (!story) {
            throw new Error("Story not initialized");
        }
        if (this.selection >= 0 && this.selection < this.choices.length) {
            story.ChooseChoiceIndex(this.selection);
            this.updateStory();
            this.updateText();
            this.selection = -1;
        }
    }
    updateStory() {
        const story = this.story;
        if (!story) {
            throw new Error("Story not initialized");
        }
        this.messages = [];
        this.choices = [];
        while (story.canContinue) {
            this.messages.push(story.Continue() ?? "");
        }
        if (story.currentChoices.length > 0) {
            this.messages.push("Choices:");
            for (let index = 0; index < story.currentChoices.length; index++) {
                const choice = story.currentChoices[index];
                this.choices.push({ text: `${index + 1}. ${choice.text}`, offset: 0, count: 0 });
            }
        }
    }
    updateText() {
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
        const mtsdfText = cacheMTSDFText(this.messages.join("\n"), font, 24, "left", getScreenWidth());
        /**
         * @type {MTSDFText[]}
         */
        const mtsdfTextChoices = [];
        this.choices.forEach((choice, i) => {
            const text = cacheMTSDFText(new Array((i !== 0 ? mtsdfTextChoices[i - 1].numLines : mtsdfText.numLines)).fill("\n").join("") + choice.text, font, 24, "left", getScreenWidth());
            mtsdfTextChoices.push(text);
        });
        let positions = mtsdfText.buffers.position;
        let texcoords = mtsdfText.buffers.uv;
        let indices = mtsdfText.buffers.index;
        let offset = indices.length;
        this.count = indices.length;
        for (let index = 0; index < mtsdfTextChoices.length; index++) {
            const mtsdfTextChoice = mtsdfTextChoices[index];
            const positionsChoice = mtsdfTextChoice.buffers.position;
            const texcoordsChoice = mtsdfTextChoice.buffers.uv;
            const indicesChoice = mtsdfTextChoice.buffers.index;
            const choice = this.choices[index];
            choice.offset = offset;
            choice.count = indicesChoice.length;
            offset += choice.count;
            indicesChoice.forEach((value, index) => indicesChoice[index] += positions.length / 3);
            positions = new Float32Array(appendBuffer(positions.buffer, positionsChoice.buffer));
            texcoords = new Float32Array(appendBuffer(texcoords.buffer, texcoordsChoice.buffer));
            indices = new Uint32Array(appendBuffer(indices.buffer, indicesChoice.buffer));
        }
        bindVAO(vao);
        bindVBO(vboPositions);
        bufferData(positions);
        bindVBO(vboTexcoords);
        bufferData(texcoords);
        bindEBO(ebo);
        bufferDataElement(indices);
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
        uniform4f(getUniformLocationCached(program, "u_color"), 0, 0, 1, 1);
        for (let index = 0; index < textures.length; index++) {
            const element = textures[index];
            activeTexture(index);
            bindTexture(element);
            uniform1i(getUniformLocationCached(program, `u_texture${index}`), index);
        }
        drawElements(0, this.count);
        for (let index = 0; index < this.choices.length; index++) {
            const choice = this.choices[index];
            uniform4f(getUniformLocationCached(program, "u_color"), this.selection === index ? 1 : 0, 0, 1, 1);
            drawElements(choice.offset, choice.count);
        }
    }
}


const m = mat4.create();