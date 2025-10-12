import { IPlugin, RenderingContext } from "@chameleon/core";
import { isElementOfType } from "./utils";


export class GLTFLoaderPlugin implements IPlugin {
  name = "GLTFLoaderPlugin";
  apply(pipeline: any) {
    pipeline.hooks.initEngine.tapPromise(this.name, async (ctx: RenderingContext) => {
      const { adapter , container} = ctx;
      if(!isElementOfType(container, HTMLCanvasElement)){
        throw new Error("Container must be an HTMLCanvasElement");
      }
      await adapter.initEngine(container, ctx);
    });

    pipeline.hooks.resourceLoad.tapPromise(this.name, async (ctx: RenderingContext) => {
       const { adapter, request} = ctx;
      if (typeof request.source === "string") {
        if (adapter.loadResources) {
           await adapter.loadResources([request.source], ctx);
        } else {
          const r = await fetch(request.source);
          const t = await r.json().catch(() => r.text());
          ctx.rawAssets = [t];
        }
      } else {
        ctx.rawAssets = [request.source];
        // ctx.rawAssets = ctx.request.source;
      }
      return ctx;
    });

    // pipeline.hooks.resourceParse.tapPromise(this.name, async (ctx: RenderingContext) => {
    //     const { adapter, request} = ctx;
    //     adapter.parseResource && await adapter.parseResource(ctx.rawAssets, ctx);
    // //   if (ctx.adapter.parseResource) ctx.parsedGLTF = await ctx.adapter.parseResource(ctx.rawAssets, ctx);
    // //   else ctx.parsedGLTF = ctx.rawAssets;
    //   return ctx;
    // });

    pipeline.hooks.buildScene.tapPromise(this.name, async (ctx: RenderingContext) => {
      if (ctx.adapter.buildScene) await ctx.adapter.buildScene(ctx.parsedGLTF, ctx);
      return ctx;
    });
  }
}
