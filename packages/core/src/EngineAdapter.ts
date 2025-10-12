import type { RenderingContext } from "./RenderingContext";

export interface EngineAdapter<TEngine, TScene, TCamera, TOptions> {
    readonly name: string;
    engine: TEngine;
    scene: TScene
    camera: TCamera;
    initEngine(container: HTMLElement, ctx: RenderingContext,options?: TOptions): Promise<RenderingContext>;
    loadResources(src: string[], ctx: RenderingContext):  Promise<RenderingContext>;
    buildScene(parsed: any, ctx: RenderingContext):  Promise<RenderingContext>;
    startRenderLoop(ctx: RenderingContext, onFrame: (t: number) => void): void;
    dispose(): void;
}
