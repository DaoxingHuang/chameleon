import type { IPlugin, Pipeline, RenderingContext } from '@chameleon/core';
import {
    AmbientLight,
    AssetType,
    BackgroundMode,
    PrimitiveMesh,
    WebGLEngine,
    Scene,
    SkyBoxMaterial
} from "@galacean/engine";
export class EnvironmentPlugin implements IPlugin {
    name = 'EnvironmentPlugin';

    apply(pipeline: Pipeline) {
        pipeline.hooks.buildScene.tapPromise(this.name, async (ctx: RenderingContext<WebGLEngine,Scene>) => {
            const { scene, engine } = ctx.engineHandles ?? {};
            const typeScene = scene;
            typeScene.background.mode = BackgroundMode.Sky;
            typeScene.background.sky.mesh = PrimitiveMesh.createCuboid(engine, 1, 1, 1);

            const environment = await engine?.resourceManager.load<AmbientLight>({
                type: AssetType.Env,
                url: 'https://gw.alipayobjects.com/os/bmw-prod/89c54544-1184-45a1-b0f5-c0b17e5c3e68.bin'
            });
            const skyMaterial = new SkyBoxMaterial(engine);
            typeScene.ambientLight = environment;
            skyMaterial.textureDecodeRGBM = true;
            skyMaterial.texture = environment.specularTexture;
            typeScene.background.sky.material = skyMaterial;
            typeScene.ambientLight.specularIntensity = 1;
            // Add your logic here
            console.log('Environment loaded:', environment);
            return ctx;
        });
        pipeline.hooks.buildScene.tapPromise(this.name, async (ctx: RenderingContext) => {
            const { camera } = ctx.engineHandles ?? {};
            camera.isOrthographic = false;
            camera.enableFrustumCulling = false;
            camera.fieldOfView = 60;
            camera.nearClipPlane = 0.1;
            camera.farClipPlane = 1000;
            // Add your logic here
            return ctx;
        });
    }
}