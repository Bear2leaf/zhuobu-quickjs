import { getProgram, getUniformLocationCached } from "../engine.js";
import { createVAO, createBuffer, bindVAO, bindVBO, bufferData, bindEBO, bufferDataElement, setVertexAttributePointer, enableVertexAttribute, activeTexture, bindTexture, drawElements, mat4, uniform1f, uniform1i, uniformMatrix4fv, useProgram, createTexture, updateTexture } from "../libs.js";
import { cHalfSizeX, cHalfSizeY, cTileSize } from "../misc/constants.js";
import { TileType } from "../misc/enums.js";
import { Character } from "../object/Character.js";
import { Map as GameMap } from "../object/Map.js";
import { MovingObject } from "../object/MovingObject.js";
import { MovingPlatform } from "../object/MovingPlatform.js";


export class SpriteRenderer {
    constructor() {
        /** @type {WebGLTexture[]} */
        this.textures = [];
        this.program = "demo"
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
            this.textures.push(tex);
        }
    }
    /**
     * 
     * @param {WebGLTexture[]} texs 
     */
    initTexture(...texs) {
        for (let index = 0; index < texs.length; index++) {
            const tex = texs[index];
            activeTexture(index);
            bindTexture(tex);
            this.textures.push(tex);
        }
    }
    initMovingPlatform() {
        this.vao = createVAO();
        this.vbo = createBuffer();
        this.ebo = createBuffer();
        const { vao, vbo, ebo, program, textures } = this;
        bindVAO(vao);
        bindVBO(vbo);
        bufferData(new Float32Array([
            +32, +8, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0,
            +32, -8, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0,
            -32, -8, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0,
            -32, +8, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0
        ]));
        bindEBO(ebo);
        bufferDataElement(new Uint32Array([
            0, 1, 3,  // first Triangle
            1, 2, 3   // second Triangle
        ]));
        this.count = 6;
        setVertexAttributePointer(0, 3, false, 8, 0);
        enableVertexAttribute(0);
        setVertexAttributePointer(1, 3, false, 8, 3);
        enableVertexAttribute(1);
        setVertexAttributePointer(2, 2, false, 8, 6);
        enableVertexAttribute(2);

    }
    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @param {number} width 
     * @param {number} height 
     */
    initQuad(x, y, width, height) {
        this.vao = createVAO();
        this.vbo = createBuffer();
        this.ebo = createBuffer();
        const { vao, vbo, ebo, program, textures } = this;
        bindVAO(vao);
        bindVBO(vbo);
        bufferData(new Float32Array([
            +width / 2 + x, +height / 2 + y, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0,
            +width / 2 + x, -height / 2 + y, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0,
            -width / 2 + x, -height / 2 + y, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0,
            -width / 2 + x, +height / 2 + y, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0
        ]));
        bindEBO(ebo);
        bufferDataElement(new Uint32Array([
            0, 1, 3,  // first Triangle
            1, 2, 3   // second Triangle
        ]));
        this.count = 6;
        setVertexAttributePointer(0, 3, false, 8, 0);
        enableVertexAttribute(0);
        setVertexAttributePointer(1, 3, false, 8, 3);
        enableVertexAttribute(1);
        setVertexAttributePointer(2, 2, false, 8, 6);
        enableVertexAttribute(2);
    }
    initCharacter() {
        this.vao = createVAO();
        this.vbo = createBuffer();
        this.ebo = createBuffer();
        const { vao, vbo, ebo, program, textures } = this;
        bindVAO(vao);
        bindVBO(vbo);
        bufferData(new Float32Array([
            cHalfSizeX, cHalfSizeY, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0,
            cHalfSizeX, -cHalfSizeY, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0,
            -cHalfSizeX, -cHalfSizeY, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0,
            -cHalfSizeX, cHalfSizeY, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0
        ]));
        bindEBO(ebo);
        bufferDataElement(new Uint32Array([
            0, 1, 3,  // first Triangle
            1, 2, 3   // second Triangle
        ]));
        this.count = 6;
        setVertexAttributePointer(0, 3, false, 8, 0);
        enableVertexAttribute(0);
        setVertexAttributePointer(1, 3, false, 8, 3);
        enableVertexAttribute(1);
        setVertexAttributePointer(2, 2, false, 8, 6);
        enableVertexAttribute(2);
    }
    /**
     * 
     * @param {GameMap} map 
     */
    initMap(map) {
        this.vao = createVAO();
        this.vbo = createBuffer();
        this.ebo = createBuffer();
        const { vao, vbo, ebo, program, textures } = this;
        const buffers = new Float32Array(map.mWidth * map.mHeight * 4 * 8);
        const indices = new Uint32Array(map.mWidth * map.mHeight * 6);
        this.count = map.mWidth * map.mHeight * 6;
        for (let i = 0; i < map.mHeight; i++) {
            for (let j = 0; j < map.mWidth; j++) {
                const position = map.getMapTilePosition(j, i);
                const tile = map.mTiles[i * map.mWidth + j];
                buffers.set([
                    +cTileSize / 2 + position[0], +cTileSize / 2 + position[1], 0.0, 1.0, 0.0, 0.0, 1.0, 1.0,
                    +cTileSize / 2 + position[0], -cTileSize / 2 + position[1], 0.0, 0.0, 1.0, 0.0, 1.0, 0.0,
                    -cTileSize / 2 + position[0], -cTileSize / 2 + position[1], 0.0, 0.0, 0.0, 1.0, 0.0, 0.0,
                    -cTileSize / 2 + position[0], +cTileSize / 2 + position[1], 0.0, 1.0, 1.0, 0.0, 0.0, 1.0
                ], (i * map.mWidth + j) * 4 * 8);
                if (tile) {
                    indices.set([
                        (i * map.mWidth + j) * 4 + 0,
                        (i * map.mWidth + j) * 4 + 1,
                        (i * map.mWidth + j) * 4 + 2,
                        (i * map.mWidth + j) * 4 + 0,
                        (i * map.mWidth + j) * 4 + 2,
                        (i * map.mWidth + j) * 4 + 3
                    ], (i * map.mWidth + j) * 6);
                } else {
                    indices.set([0, 0, 0, 0, 0, 0], (i * map.mWidth + j) * 6);
                }
            }
        }
        bindVAO(vao);
        bindVBO(vbo);
        bufferData(buffers);
        bindEBO(ebo);
        bufferDataElement(indices);
        setVertexAttributePointer(0, 3, false, 8, 0);
        enableVertexAttribute(0);
        setVertexAttributePointer(1, 3, false, 8, 3);
        enableVertexAttribute(1);
        setVertexAttributePointer(2, 2, false, 8, 6);
        enableVertexAttribute(2);

    }
    render() {
        const { vao, vbo, ebo, program, textures } = this;
        if (!vao) {
            throw new Error("VAO not initialized");
        }
        if (!vbo) {
            throw new Error("VBO not initialized");
        }
        if (!ebo) {
            throw new Error("EBO not initialized");
        }
        useProgram(getProgram(program));
        bindVAO(vao);
        bindVBO(vbo);
        bindEBO(ebo);
        uniform1f(getUniformLocationCached(program, "u_time"), 0);
        for (let index = 0; index < textures.length; index++) {
            const element = textures[index];
            activeTexture(index);
            bindTexture(element);
            uniform1i(getUniformLocationCached(program, `u_texture${index}`), index);
        }
        if (this.count) {
            drawElements(this.count);
        }
    }
}

