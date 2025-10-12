import { Pipeline } from "./Pipeline";

export interface IPlugin {
  name: string;
  apply: (pipeline: Pipeline) => void;
}


