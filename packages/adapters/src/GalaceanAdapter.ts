import { EngineAdapter, RenderingContext } from "@chameleon/core";
import { Scene, Camera, WebGLEngine as GLEngine, WebGLGraphicDeviceOptions, WebGLEngine, AssetType, GLTFResource } from "@galacean/engine";
// import { WebGLEngine,Camera } from "@galacean/engine";


/** ，
 * Adapter for Galacean engine.
 * To use this adapter, install `@galacean/engine` in your project.
 * Galacean engine is a web-first 3D engine, see @link https://www.galacean.com/engine for more details.
 */
export class GalaceanAdapter implements EngineAdapter<GLEngine, Scene, Camera, WebGLGraphicDeviceOptions> {

  name = "galacean";
  engine!: GLEngine;
  scene!: Scene;
  camera!: Camera;

  async initEngine(container: HTMLElement, ctx: RenderingContext, options?: WebGLGraphicDeviceOptions): Promise<RenderingContext> {
    const graphicDeviceOptions = options as WebGLGraphicDeviceOptions | undefined;
    this.engine = await WebGLEngine.create({ canvas: container as HTMLCanvasElement, graphicDeviceOptions });
    this.scene = this.engine.sceneManager.activeScene;
    const rootEntity = this.scene.createRootEntity("root");
    const cameraEntity = rootEntity.createChild("camera");
    this.camera = cameraEntity.addComponent(Camera);
    this.engine.run();
    this.engine.canvas.resizeByClientSize();
    ctx.engineHandles = { engine: this.engine, scene: this.scene, camera: this.camera };
    return ctx;
  }


  async loadResources(src: string[], ctx: RenderingContext): Promise<RenderingContext> {
    const engine = ctx?.engineHandles?.engine;
    if (!engine) throw new Error("Galacean engine not initialized");
    // const reesources = src.map((s) => ({ url: s, type: AssetType.GLTF }));
    ctx.rawAssets = await this.engine.resourceManager.load(src);
    debugger;
    return ctx;
  }

  async parseResource(resource: any, ctx: RenderingContext) {
    ctx.parsedGLTF = resource;
    return ctx;
  }

  async buildScene(parsed: any, ctx: RenderingContext): Promise<RenderingContext> {
    const { scene } = ctx?.engineHandles ?? {};
    const { rawAssets } = ctx;
    if (!scene) throw new Error("Galacean engine not initialized");
    if (!rawAssets) throw new Error("No assets to build scene");
    const mainAssets = rawAssets[0] as GLTFResource;
    const defaultSceneRoot = mainAssets.instantiateSceneRoot();
    const rootEntity = scene.getRootEntity();
    rootEntity.addChild(defaultSceneRoot);
    return ctx;
  }

  startRenderLoop(ctx: RenderingContext, onFrame: (dt: number) => void) {
    const loop = () => {
      if (ctx.abortSignal && ctx.abortSignal.aborted) return;
      if (this.engine && this.engine.update) this.engine.update();
      onFrame(0);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  dispose() {
    this.engine.destroy();
  }
}
