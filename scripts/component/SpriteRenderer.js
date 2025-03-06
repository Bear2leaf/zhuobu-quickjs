import { getProgram, getUniformLocationCached } from "../engine.js";
import { activeTexture, bindEBO, bindTexture, bindVAO, bindVBO, bufferData, bufferDataElement, createBuffer, createTexture, createVAO, drawElements, enableVertexAttribute, setVertexAttributePointer, uniform1f, uniform1i, updateTexture, useProgram, vec2, vec3 } from "../libs.js";
import { cHalfSizeX, cHalfSizeY, cTileSize } from "../misc/constants.js";
import { TileCollisionType } from "../misc/enums.js";
import { Map as GameMap } from "../object/Map.js";


export class SpriteRenderer {
    constructor() {
        /** @type {WebGLTexture[]} */
        this.textures = [];
        this.program = "sprite"
        this.offset = 0;
        this.maxFrames = 1;
        this.frames = 0;
        this.count = 6;
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
     * @param {AtlasContainer} atlas 
     */
    setAtlas(atlas) {
        this.atlas = atlas;
    }
    initMovingPlatform() {
        this.vao = createVAO();
        this.vbo = createBuffer();
        this.ebo = createBuffer();
        const { vao, vbo, ebo, program, atlas } = this;
        if (!atlas) {
            throw new Error("Atlas not initialized");
        }
        this.textures = [atlas.texture];
        bindVAO(vao);
        bindVBO(vbo);
        const rect = atlas.atlasData["atlas/platform/movingPlatform"];
        const u0 = rect.x;
        const v0 = rect.y;
        const u1 = rect.x + rect.width;
        const v1 = rect.y + rect.height;
        /** @type {[number, number][]} */
        const uv = [
            [u1 / atlas.atlasSize, v1 / atlas.atlasSize],
            [u1 / atlas.atlasSize, v0 / atlas.atlasSize],
            [u0 / atlas.atlasSize, v0 / atlas.atlasSize],
            [u0 / atlas.atlasSize, v1 / atlas.atlasSize]
        ];
        bindVAO(vao);
        bindVBO(vbo);
        bufferData(new Float32Array([
            ...vec3.mul(vec3.create(), vec3.rotateZ(vec3.create(), [0.5, 0.5, 0.0], [0, 0, 0], rect.rotated ? Math.PI / 2 : 0), [64, -16, 1]), 1.0, 1.0, 1.0, ...uv[0],
            ...vec3.mul(vec3.create(), vec3.rotateZ(vec3.create(), [0.5, -0.5, 0.0], [0, 0, 0], rect.rotated ? Math.PI / 2 : 0), [64, -16, 1]), 1.0, 1.0, 1.0, ...uv[1],
            ...vec3.mul(vec3.create(), vec3.rotateZ(vec3.create(), [-0.5, -0.5, 0.0], [0, 0, 0], rect.rotated ? Math.PI / 2 : 0), [64, -16, 1]), 1.0, 1.0, 1.0, ...uv[2],
            ...vec3.mul(vec3.create(), vec3.rotateZ(vec3.create(), [-0.5, 0.5, 0.0], [0, 0, 0], rect.rotated ? Math.PI / 2 : 0), [64, -16, 1]), 1.0, 1.0, 1.0, ...uv[3],
        ]));
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
            +width / 2 + x, +height / 2 + y, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0,
            +width / 2 + x, -height / 2 + y, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0,
            -width / 2 + x, -height / 2 + y, 0.0, 1.0, 1.0, 1.0, 0.0, 0.0,
            -width / 2 + x, +height / 2 + y, 0.0, 1.0, 1.0, 1.0, 0.0, 1.0
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
        const { vao, vbo, ebo, program, textures, atlas } = this;
        if (!atlas) {
            throw new Error("Atlas not initialized");
        }

        const rect = atlas.atlasData["atlas/platform/character"];
        const maxFrames = this.maxFrames = Math.floor(rect.width / (cHalfSizeX * 2));
        const u0 = rect.x;
        const v0 = rect.y;
        const u1 = rect.x + rect.width / maxFrames;
        const v1 = rect.y + rect.height;
        /** @type {[number, number][]} */
        const uv = [
            [u1 / atlas.atlasSize, v1 / atlas.atlasSize],
            [u1 / atlas.atlasSize, v0 / atlas.atlasSize],
            [u0 / atlas.atlasSize, v0 / atlas.atlasSize],
            [u0 / atlas.atlasSize, v1 / atlas.atlasSize]
        ];
        const buffer = new Float32Array(8 * 4 * maxFrames);
        const indices = new Uint32Array(6 * maxFrames);
        for (let i = 0; i < maxFrames; i++) {
            buffer.set([
                ...vec3.mul(vec3.create(), vec3.rotateZ(vec3.create(), [cHalfSizeX, cHalfSizeY, 0.0], [0, 0, 0], rect.rotated ? Math.PI / 2 : 0), [1, -1, 1]), 1.0, 1.0, 1.0, ...uv[0],
                ...vec3.mul(vec3.create(), vec3.rotateZ(vec3.create(), [cHalfSizeX, -cHalfSizeY, 0.0], [0, 0, 0], rect.rotated ? Math.PI / 2 : 0), [1, -1, 1]), 1.0, 1.0, 1.0, ...uv[1],
                ...vec3.mul(vec3.create(), vec3.rotateZ(vec3.create(), [-cHalfSizeX, -cHalfSizeY, 0.0], [0, 0, 0], rect.rotated ? Math.PI / 2 : 0), [1, -1, 1]), 1.0, 1.0, 1.0, ...uv[2],
                ...vec3.mul(vec3.create(), vec3.rotateZ(vec3.create(), [-cHalfSizeX, cHalfSizeY, 0.0], [0, 0, 0], rect.rotated ? Math.PI / 2 : 0), [1, -1, 1]), 1.0, 1.0, 1.0, ...uv[3],
            ], i * 8 * 4);
            vec2.add(uv[0], uv[0], [(cHalfSizeX * 2) / atlas.atlasSize, 0])
            vec2.add(uv[1], uv[1], [(cHalfSizeX * 2) / atlas.atlasSize, 0])
            vec2.add(uv[2], uv[2], [(cHalfSizeX * 2) / atlas.atlasSize, 0])
            vec2.add(uv[3], uv[3], [(cHalfSizeX * 2) / atlas.atlasSize, 0])
            indices.set([
                i * 4 + 0,
                i * 4 + 1,
                i * 4 + 3,
                i * 4 + 1,
                i * 4 + 2,
                i * 4 + 3
            ], i * 6);
        }
        bindVAO(vao);
        bindVBO(vbo);
        bufferData(buffer);
        bindEBO(ebo);
        bufferDataElement(indices);
        this.offset = 0;
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
        const { vao, vbo, ebo, program, textures, atlas } = this;
        if (!atlas) {
            throw new Error("Atlas not initialized");
        }
        this.textures = [atlas.texture];
        const blockRect = atlas.atlasData["atlas/platform/block"];
        const onewayRect = atlas.atlasData["atlas/platform/slope45oneway"];
        const blocku0 = blockRect.x;
        const blockv0 = blockRect.y;
        const blocku1 = blockRect.x + blockRect.width;
        const blockv1 = blockRect.y + blockRect.height;
        const onewayu0 = onewayRect.x;
        const onewayv0 = onewayRect.y;
        const onewayu1 = onewayRect.x + onewayRect.width;
        const onewayv1 = onewayRect.y + onewayRect.height;
        /** @type {[number, number][]} */
        const blockuv = [
            [blocku1 / atlas.atlasSize, blockv1 / atlas.atlasSize],
            [blocku1 / atlas.atlasSize, blockv0 / atlas.atlasSize],
            [blocku0 / atlas.atlasSize, blockv0 / atlas.atlasSize],
            [blocku0 / atlas.atlasSize, blockv1 / atlas.atlasSize]
        ];
        /** @type {[number, number][]} */
        const onewayuv = [
            [onewayu1 / atlas.atlasSize, onewayv1 / atlas.atlasSize],
            [onewayu1 / atlas.atlasSize, onewayv0 / atlas.atlasSize],
            [onewayu0 / atlas.atlasSize, onewayv0 / atlas.atlasSize],
            [onewayu0 / atlas.atlasSize, onewayv1 / atlas.atlasSize]
        ];
        const buffers = new Float32Array(map.mWidth * map.mHeight * 4 * 8);
        const indices = new Uint32Array(map.mWidth * map.mHeight * 6);
        this.count = map.mWidth * map.mHeight * 6;
        for (let i = 0; i < map.mHeight; i++) {
            for (let j = 0; j < map.mWidth; j++) {
                const position = map.getMapTilePosition(j, i);
                const tile = map.getCollisionType(j, i);
                buffers.set([
                    ...vec3.rotateZ(vec3.create(), [+cTileSize / 2 + position[0], +cTileSize / 2 + position[1], 0.0], [position[0], position[1], 0], tile === TileCollisionType.Full ? Math.PI : tile === TileCollisionType.OneWaySlope45 ? Math.PI * 3 / 2 : Math.PI), 1.0, 1.0, 1.0, ...(tile === TileCollisionType.Full ? blockuv[0] : tile === TileCollisionType.OneWaySlope45 ? onewayuv[0] : [0, 0]),
                    ...vec3.rotateZ(vec3.create(), [+cTileSize / 2 + position[0], -cTileSize / 2 + position[1], 0.0], [position[0], position[1], 0], tile === TileCollisionType.Full ? Math.PI : tile === TileCollisionType.OneWaySlope45 ? Math.PI * 3 / 2 : Math.PI), 1.0, 1.0, 1.0, ...(tile === TileCollisionType.Full ? blockuv[1] : tile === TileCollisionType.OneWaySlope45 ? onewayuv[1] : [0, 0]),
                    ...vec3.rotateZ(vec3.create(), [-cTileSize / 2 + position[0], -cTileSize / 2 + position[1], 0.0], [position[0], position[1], 0], tile === TileCollisionType.Full ? Math.PI : tile === TileCollisionType.OneWaySlope45 ? Math.PI * 3 / 2 : Math.PI), 1.0, 1.0, 1.0, ...(tile === TileCollisionType.Full ? blockuv[2] : tile === TileCollisionType.OneWaySlope45 ? onewayuv[2] : [0, 0]),
                    ...vec3.rotateZ(vec3.create(), [-cTileSize / 2 + position[0], +cTileSize / 2 + position[1], 0.0], [position[0], position[1], 0], tile === TileCollisionType.Full ? Math.PI : tile === TileCollisionType.OneWaySlope45 ? Math.PI * 3 / 2 : Math.PI), 1.0, 1.0, 1.0, ...(tile === TileCollisionType.Full ? blockuv[3] : tile === TileCollisionType.OneWaySlope45 ? onewayuv[3] : [0, 0]),
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
        uniform1f(getUniformLocationCached(program, "u_time"), 0);
        for (let index = 0; index < textures.length; index++) {
            const element = textures[index];
            activeTexture(index);
            bindTexture(element);
            uniform1i(getUniformLocationCached(program, `u_texture${index}`), index);
        }
        if (this.frames % 10 === 0) {
            this.frames = 0;
            this.offset = (this.offset + 1) % this.maxFrames;
        }
        drawElements(this.offset * 6, this.count);
        this.frames++;
    }
}

