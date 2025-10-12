import { AsyncSeriesHook, AsyncSeriesWaterfallHook, AsyncSeriesBailHook, AsyncParallelHook, SyncHook } from "tapable";
import type { RenderingContext, RenderRequest } from "./RenderingContext";
import { Logger, PipelineLogger } from "./Logger";
import { EngineAdapter } from "./EngineAdapter";
import { IPlugin } from "@/Plugin";

export type StageHooks = {
  initEngine: AsyncSeriesHook<[RenderingContext]>;
  resourceLoad: AsyncSeriesWaterfallHook<[RenderingContext]>;
  resourceParse: AsyncSeriesBailHook<[RenderingContext], any>;
  buildScene: AsyncSeriesWaterfallHook<[RenderingContext]>;
  renderLoop: AsyncParallelHook<[RenderingContext]>;
  postProcess: AsyncSeriesHook<[RenderingContext]>;
  dispose: SyncHook<[RenderingContext]>;
};

export class Pipeline<TEngine = any, TScene = any, TCamera = any, TOptions = any> {
  public hooks: StageHooks;
  public logger?: Logger = console;

  constructor(public adapter: EngineAdapter<TEngine, TScene, TCamera, TOptions>) {
    this.adapter = adapter;
    this.hooks = {
      initEngine: new AsyncSeriesHook(["ctx"]),
      resourceLoad: new AsyncSeriesWaterfallHook(["ctx"]),
      resourceParse: new AsyncSeriesBailHook(["ctx"]),
      buildScene: new AsyncSeriesWaterfallHook(["ctx"]),
      renderLoop: new AsyncParallelHook(["ctx"]),
      postProcess: new AsyncSeriesHook(["ctx"]),
      dispose: new SyncHook(["ctx"])
    };
  }

  use(plugin: IPlugin) {
    plugin.apply(this);
  }

  usePreset(plugins: IPlugin[]) {
    plugins.forEach((p) => this.use(p));
  }

  setLogger(logger: Logger) {
    this.logger = logger;
  }

  async run(container: HTMLElement, request: RenderRequest): Promise<RenderingContext> {
    const abortController = new AbortController();
    const ctx: RenderingContext = {
      request,
      container,
      adapter: this.adapter,
      metadata: {},
      abortController,
      abortSignal: abortController.signal,
      renderState: { running: false, frameCount: 0 },
      pipeline: this
    };

    const checkAbort = () => {
      if (ctx.abortSignal.aborted) throw new Error("Pipeline aborted");
    };

    // engineInit
    checkAbort();
    await this.hooks.initEngine.promise(ctx);

    // resourceLoad (waterfall)
    checkAbort();
    const afterLoad = await this.hooks.resourceLoad.promise(ctx);

    // parse (bail)
    checkAbort();
    const bailResult = await this.hooks.resourceParse.promise(ctx);
    if (bailResult === false) {
      throw new Error("Pipeline resourceParse bail: validation failed");
    }

    // buildScene
    checkAbort();
    const afterBuild = await this.hooks.buildScene.promise(ctx);

    // start render loop (adapter-managed)
    ctx.renderState = ctx.renderState ?? { running: true, frameCount: 0 };
    ctx.renderState.running = true;
    if (this.adapter.startRenderLoop) {
      this.adapter.startRenderLoop(ctx, (dt: number) => {
        ctx.renderState!.frameCount = (ctx.renderState!.frameCount || 0) + 1;
        this.hooks.renderLoop.callAsync(ctx, (err?: any) => {
          if (err) {
            ctx.renderState!.lastError = err;
          }
        });
      });
    } else {
      // call renderLoop once to allow plugins to set up
      await this.hooks.renderLoop.promise(ctx);
    }

    // postProcess
    await this.hooks.postProcess.promise(ctx);

    return ctx;
  }

  async dispose(ctx: RenderingContext) {
    try {
      ctx.abortController.abort();
    } catch (e) { }
    try {
      this.hooks.dispose.call(ctx);
    } catch (e) { }
    // this.adapter.stopRenderLoop?.(ctx);
    this.adapter.dispose?.();
  }
}
