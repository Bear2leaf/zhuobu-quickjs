import { initContext, uninitContext, shouldClose, beginFrame, endFrame, setClearColor, drawSquare, now, getScreenWidth, getScreenHeight } from "../libs/context.so";
import { vec4, vec3, mat4 } from "../libs/gl-matrix/index.js";
const color = vec4.create();
const camera = vec3.create();


function drawSquares() {
    vec3.set(camera, getScreenWidth() / 2, getScreenHeight() / 2, 0);
    for (let i = 0; i < 10; i++) {
        // rainbow colors
        vec4.set(color, Math.sin(now() / 1000 + Math.PI / 4 * i) / 2 + 0.5, Math.sin(now() / 1000 + Math.PI / 4 * i + 2 * Math.PI / 3) / 2 + 0.5, Math.sin(now() / 1000 + Math.PI / 4 * i + 4 * Math.PI / 3) / 2 + 0.5, 1);
        drawSquare(camera, now() / 1000 + Math.PI / 4 * i / 1.5, vec3.fromValues(20, 20, 1), color);
    }
}

export function mainQuickjs() {
    initContext();
    do {
        setClearColor(0.0, 0.0, 0.0, 1.0);
        beginFrame();
        drawSquares();
        endFrame();
    } while (!shouldClose());
    uninitContext();
}
export function main() {
    initContext();
    function loop() {
        setClearColor(0.0, 0.0, 0.0, 1.0);
        beginFrame();
        drawSquares();
        endFrame();
        requestAnimationFrame(loop);
    }
    loop();

}