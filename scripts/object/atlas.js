import { activeTexture, beginFramebuffer, bindEBO, bindTexture, bindVAO, bindVBO, bufferData, bufferDataElement, clearColor, createBuffer, createFramebuffer, createShaderProgram, createTexture, createVAO, drawElements, enableVertexAttribute, endFramebuffer, getScreenHeight, getScreenWidth, getUniformLocation, loadImage, loadText, mat4, setVertexAttributePointer, uniform1i, uniform4f, uniformMatrix4fv, updateTexture, useProgram, vec2, vec3, vec4 } from "../libs.js";

/**
 * 
 * @param {AtlasNode} root 
 * @param {number} w 
 * @param {number} h 
 * @param {number} padding 
 * @returns {AtlasNode|null}
 */
export function findNode(root, w, h, padding = 0) {
    if (root.used) {
        let n = null;

        if ((n = findNode(root.child[0], w, h, padding)) || (n = findNode(root.child[1], w, h, padding))) {
            return n;
        }
    }
    else if (w <= root.w && h <= root.h) {
        splitNode(root, w, h, padding);

        return root;
    }

    return null;
}
/**
 * 
 * @param {AtlasNode} node 
 * @param {number} w 
 * @param {number} h 
 * @param {number} padding 
 */
export function splitNode(node, w, h, padding) {
    node.used = true;

    node.child = [{
        x: node.x + w + padding,
        y: node.y,
        w: node.w - w - padding,
        h: h,
        used: false,
        child: null
    }, {
        x: node.x,
        y: node.y + h + padding,
        w: node.w,
        h: node.h - h - padding,
        used: false,
        child: null
    }]

}


/**
 * @type {Map<string, ImageContainer & {name:string}>}
 */
const imageCache = new Map();

let vert = "";
let frag = "";

export async function loadAtlasShaderSource() {
    vert = await loadText("resources/glsl/atlas.vert.sk");
    frag = await loadText("resources/glsl/atlas.frag.sk");
}

export async function addAtlas() {

    const urls = new Set([
        "atlas/tall/long",
        "atlas/platform/small-platform",
        "atlas/platform/platform-long",
        "atlas/platform/block",
        "atlas/platform/door",
    ]);
    for (const name of urls) {
        imageCache.set(name, { ...await loadImage(`resources/${name}.png`), name });
    }
    return imageCache;
}


/**
 * @param {WebGLBuffer} vbo 
 * @param {ImageContainer} data 
 * @param {number} x
 * @param {number} y
 * @param {number} angle 
 */
function draw(vbo, data, x, y, angle) {
    const center = vec2.fromValues(x + data.width / 2, y + data.height / 2);
    const p0 = vec2.fromValues(x, y);
    const p1 = vec2.fromValues(x + data.width, y);
    const p2 = vec2.fromValues(x + data.width, y + data.height);
    const p3 = vec2.fromValues(x, y + data.height);
    vec2.rotate(p0, p0, center, angle);
    vec2.rotate(p1, p1, center, angle);
    vec2.rotate(p2, p2, center, angle);
    vec2.rotate(p3, p3, center, angle);
    const positions = new Float32Array([
        0, 0, 0,
        1, 0, 0,
        1, 1, 0,
        0, 1, 0
    ]);
    const texcoords = new Float32Array([
        0, 0,
        1, 0,
        1, 1,
        0, 1
    ]);
    positions[0] = p0[0];
    positions[1] = p0[1];
    positions[3] = p1[0];
    positions[4] = p1[1];
    positions[6] = p2[0];
    positions[7] = p2[1];
    positions[9] = p3[0];
    positions[10] = p3[1];




    texcoords[0] = 0 / data.width;
    texcoords[1] = 0 / data.height;
    texcoords[2] = (0 + data.width) / data.width;
    texcoords[3] = 0 / data.height;
    texcoords[4] = (0 + data.width) / data.width;
    texcoords[5] = (0 + data.height) / data.height;
    texcoords[6] = 0 / data.width;
    texcoords[7] = (0 + data.height) / data.height;

    bindVBO(vbo);
    bufferData(new Float32Array([
        positions[0], positions[1], positions[2], texcoords[0], texcoords[1],
        positions[3], positions[4], positions[5], texcoords[2], texcoords[3],
        positions[6], positions[7], positions[8], texcoords[4], texcoords[5],
        positions[9], positions[10], positions[11], texcoords[6], texcoords[7]
    ]));
    drawElements(6);


}
export function buildAtlas() {
    const vao = createVAO();
    const ebo = createBuffer();
    const vbo = createBuffer();
    const program = createShaderProgram(vert, frag);
    const dest = { x: 0, y: 0, width: 0, height: 0 };
    const padding = 1;
    const atlasSize = 128;
    const color = vec4.fromValues(1, 1, 1, 1);
    useProgram(program);
    bindVAO(vao);
    bindEBO(ebo);
    bufferDataElement(new Uint32Array([
        0, 1, 2,
        0, 2, 3
    ]));
    bindVBO(vbo);

    setVertexAttributePointer(0, 3, false, 5, 0);
    enableVertexAttribute(0);
    setVertexAttributePointer(1, 2, false, 5, 3);
    enableVertexAttribute(1);
    uniform4f(getUniformLocation(program, "u_color"), color[0], color[1], color[2], color[3]);
    const m = mat4.create();
    mat4.ortho(m, 0, atlasSize, atlasSize, 0, -1, 1)
    uniformMatrix4fv(getUniformLocation(program, "u_projection"), false, m);
    mat4.identity(m);
    uniformMatrix4fv(getUniformLocation(program, "u_modelView"), false, m);
    const framebuffer = createFramebuffer(atlasSize, atlasSize);
    beginFramebuffer(framebuffer);
    clearColor(0, 0, 0, 0);
    /**
     * @type {AtlasNode}
     */
    const root = {
        x: 0,
        y: 0,
        w: atlasSize,
        h: atlasSize,
        used: false,
        child: null
    }
    /**
     * @type {AtlasNode|null}
     */
    let n = null;
    const images = [...imageCache.keys()].map((key) => {
        const img = imageCache.get(key);
        if (!img) {
            throw new Error("Image not found");
        }
        return img
    });
    images.sort((a, b) => b.width - a.width);
    const texture = createTexture();
    /** @type {AtlasContainer["atlasData"]} */
    const atlasData = {};
    bindTexture(texture);
    for (const image of images) {
        let rotated = false;
        const w = image.width;
        const h = image.height;
        n = findNode(root, w, h, padding);
        if (!n) {
            rotated = true;
            n = findNode(root, h, w, padding);
        }
        if (n) {
            if (rotated) {
                n.h = w;
                n.w = h;
            }
            dest.x = n.x;
            dest.y = n.y;
            dest.width = n.w;
            dest.height = n.h;
            updateTexture(image);
            if (!rotated) {
                draw(vbo, image, dest.x, dest.y, 0);
                dest.y = atlasSize - dest.y - h;
                dest.width = w;
                dest.height = h;
            } else {
                draw(vbo, image, dest.x + dest.width / 2 - image.width / 2, dest.y + dest.height / 2 - image.height / 2, Math.PI / 2);
                dest.y = atlasSize - dest.y - w;
                dest.width = h;
                dest.height = w;
            }
            atlasData[image.name] = {
                x: dest.x,
                y: dest.y,
                width: dest.width,
                height: dest.height,
                rotated
            }
        } else {
            throw new Error("Atlas is full");
        }

    }
    endFramebuffer();
    return { texture: framebuffer.texture, atlasData, atlasSize };
}