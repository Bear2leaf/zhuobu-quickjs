import { initContext, tick, uninitContext } from "context.so";
export function main() {
    initContext();
    tick();
    uninitContext();
}