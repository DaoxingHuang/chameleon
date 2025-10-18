import { EngineAdapter, RenderingContext } from "@chameleon/core";
import { Scene, Camera, WebGLEngine as GLEngine, WebGLGraphicDeviceOptions, WebGLEngine, AssetType, GLTFResource, Entity, LoadItem } from "@galacean/engine";
import { SUPPORTED_ADAPTERS } from "./constants";
// import { WebGLEngine,Camera } from "@galacean/engine";

type SpecRenderingContext = RenderingContext<GLEngine, Scene, Camera, WebGLGraphicDeviceOptions, GLTFResource, Entity>

/** ，
 * Adapter for Galacean engine.
 * To use this adapter, install `@galacean/engine` in your project.
 * Galacean engine is a web-first 3D engine, see @link https://www.galacean.com/engine for more details.
 */
export class GalaceanAdapter implements EngineAdapter<GLEngine, Scene, Camera,GLTFResource,Entity, WebGLGraphicDeviceOptions> {


  name = SUPPORTED_ADAPTERS.galacean;
  engine!: GLEngine;
  scene!: Scene;
  camera!: Camera;

  async initEngine(container: HTMLElement, ctx: RenderingContext, options?: WebGLGraphicDeviceOptions) {
    const graphicDeviceOptions = options as WebGLGraphicDeviceOptions | undefined;
    this.engine = await WebGLEngine.create({ canvas: container as HTMLCanvasElement, graphicDeviceOptions });
    this.scene = this.engine.sceneManager.activeScene;
    const rootEntity = this.scene.createRootEntity("root");
    const cameraEntity = rootEntity.createChild("camera");
    this.camera = cameraEntity.addComponent(Camera);
    this.engine.run();
    this.engine.canvas.resizeByClientSize();
    const engineHandles = { engine: this.engine, scene: this.scene, camera: this.camera };
    return engineHandles;
  }


  async loadResource(src: string, ctx : SpecRenderingContext): Promise<GLTFResource> {
    const engine = ctx?.engineHandles?.engine;
    if (!engine) throw new Error("Galacean engine not initialized");
    const rawAssets = await this.engine.resourceManager.load<GLTFResource>({
      type: AssetType.GLTF,
      url: src
    });
    return rawAssets 
  }

  async parseResource(assets: GLTFResource, ctx: SpecRenderingContext): Promise<Entity> {
    // const { rawAssets } = ctx;
    if (!assets) throw new Error("No raw assets to parse");
    // const gltfAsset = rawAssets[0] as GLTFResource;
    const gltfSceneRoot = assets.instantiateSceneRoot();
    // const parsedGLTF = { targetEngineEntity: gltfSceneRoot };
    // ctx.parsedGLTF = { targetEngineEntity: gltfSceneRoot };
    return gltfSceneRoot;
  }

  async buildScene(parsed:any,ctx: RenderingContext): Promise<RenderingContext> {
     const { parsedGLTF, engineHandles } = ctx ?? {};
    const { scene } = engineHandles?? {};
    if (!scene) throw new Error("Galacean engine not initialized");
     if (!parsedGLTF?.targetEngineEntity) throw new Error("No parsed GLTF to build scene");
    // if (!rawAssets) throw new Error("No assets to build scene");
    // const mainAssets = rawAssets[0] as GLTFResource;
    const defaultSceneRoot = parsedGLTF.targetEngineEntity;
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
