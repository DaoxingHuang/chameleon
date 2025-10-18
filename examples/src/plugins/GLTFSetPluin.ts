import type { IPlugin, Pipeline, RenderingContext } from '@chameleon/core';
import {
    AmbientLight,
    AnimationClip,
    Animator,
    AssetType,
    BackgroundMode,
    BoundingBox,
    Camera,
    Color,
    DirectLight,
    Entity,
    GLTFResource,
    Logger,
    Material,
    MeshRenderer,
    PBRMaterial,
    PrimitiveMesh,
    Renderer,
    Scene,
    SkyBoxMaterial,
    Texture2D,
    UnlitMaterial,
    Vector3,
    WebGLEngine
} from "@galacean/engine";
export class EnvironmentPlugin implements IPlugin {
    name = 'EnvironmentPlugin';

    apply(pipeline: Pipeline) {
        pipeline.hooks.buildScene.tapPromise(this.name, async (ctx: RenderingContext) => {
            return ctx;
        });
    }
}