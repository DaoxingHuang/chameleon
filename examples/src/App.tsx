import React, { useRef, useState } from "react";
import { Pipeline, type RenderRequest, type IPlugin as PipelinePlugin } from "@chameleon/core";
import { GalaceanAdapter } from "@chameleon/adapters/src";


import { attachLoggerToPipeline } from "@chameleon/core";
import type { RenderingContext } from "@chameleon/core";
import { GLTFLoaderPlugin } from "@chameleon/plugins";
import { EnvironmentPlugin } from "./plugins/EnvironmentPlugin";

// import { attachInterceptorToPipeline } from "@chameleon/core";

// expose for devtools
declare global {
  interface Window {
    __GLPIPE_CTX__: any;
    __GLPIPE_PLUGINS__: any[];
  }
}

// export class GLTFLoaderPlugin implements PipelinePlugin {
//   name = "GLTFLoaderPlugin";
//   apply(pipeline: Pipeline): void {
//     pipeline.hooks.initEngine.tapPromise(this.name, async (ctx: RenderingContext): Promise<void> => {
//       const { container, adapter } = ctx;
//       // const container = document.getElementById('app') as HTMLElement;
//       await adapter.initEngine(container, ctx);
//     });
//   }
// }

export default function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState("idle");
  const [ctxRef, setCtxRef] = useState<any>(null);

  const loadDemo = async () => {
    setStatus("initializing");
    const adapter = new GalaceanAdapter();
    const pipeline = new Pipeline(adapter);
    attachLoggerToPipeline(pipeline, console);
    // attach plugins
    const plugins = [
      new GLTFLoaderPlugin(),
      new EnvironmentPlugin(),
      // new ValidatorPlugin(),
      // new CustomShaderPlugin(),
      // new VideoTexturePlugin(),
      // new DeviceStatePlugin()
    ];
    plugins.forEach((p) => pipeline.use(p));
    // plugins.forEach((p) => pipeline.use(p));
    // // expose plugin list to devtools
    // (window as any).__GLPIPE_PLUGINS__ = plugins.map((p) => ({ name: p.name }));

    // const logger = new PipelineLogger();
    // pipeline.setLogger(logger);
    // attachInterceptorToPipeline(pipeline, logger);
    // // expose logger to devtools (devtools app can set this into its store by window global)
    // (window as any).__GLPIPE_LOGGER__ = logger;

    // create request with simple inline glTF-like structure

    const data: RenderRequest = { id: "demo", source: 'https://mdn.alipayobjects.com/chain_myent/uri/file/as/mynftmerchant/202503101107170115.gltf' };

    try {

      const ctx = await pipeline.run(document.getElementById('canvas') as HTMLCanvasElement, data);
      // attach pipeline ref for dispose
      (ctx as any).pipelineInstance = pipeline;
      (window as any).__GLPIPE_CTX__ = ctx;
      setCtxRef(ctx);
      setStatus("running");
    } catch (e: any) {
      setStatus("error: " + e.message);
    }
  };

  const abort = () => {
    const ctx = (window as any).__GLPIPE_CTX__;
    if (ctx && ctx.abortController) {
      ctx.abortController.abort();
      setStatus("aborted");
    }
  };

  const dispose = async () => {
    const ctx = (window as any).__GLPIPE_CTX__;
    if (ctx && ctx.pipeline) {
      await ctx.pipeline.dispose(ctx);
      (window as any).__GLPIPE_CTX__ = null;
      setStatus("disposed");
    }
  };

  return (
    <div className="w-screen h-screen flex">
      <div style={{ width: 360, background: "#0b0b0b", color: "#ddd", padding: 12 }}>
        <div className="flex gap-2">
          <button className="bg-slate-700 px-3 py-1 rounded" onClick={loadDemo}>
            Load Demo
          </button>
          <button className="bg-slate-700 px-3 py-1 rounded" onClick={abort}>
            Abort
          </button>
          <button className="bg-slate-700 px-3 py-1 rounded" onClick={dispose}>
            Dispose
          </button>
        </div>
        <div className="mt-2">Status: {status}</div>
        <div className="mt-4">
          <h4 className="text-sm mb-2">Instructions</h4>
          <div className="text-xs text-slate-300">
            Click "Load Demo" to run pipeline. Open DevTools app separately (port 5174) and it will pick up pipeline
            logger & context exposed on window.
          </div>
        </div>
      </div>
      <canvas id="canvas" style={{ flex: 1, background: "#111" }} />

    </div>
  );
}
