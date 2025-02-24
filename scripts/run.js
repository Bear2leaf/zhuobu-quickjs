import { getTime, initContext, pollEvents, shouldCloseWindow, swapBuffers, terminate } from "./libs.js";
import { init, update, render, load } from "./engine.js";


const FPS = 60;


export async function mainQuickjs() {
    await load();
    let lastTime = getTime();
    let acc = 0;
    init();
    do {
        const currentTime = getTime();
        const delta = currentTime - lastTime;
        acc += delta;
        lastTime = currentTime;
        while (acc >= 1 / FPS) {
            acc -= 1 / FPS;
            update();
        }
        render();
        swapBuffers();
        pollEvents();
    } while (!shouldCloseWindow());
    terminate();
}
export async function main() {
    await load();
    init();
    function loop() {
        update();
        render();
        requestAnimationFrame(loop);
    }
    loop();

}


