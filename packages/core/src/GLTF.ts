/**
 * GLTF (GL Transmission Format) type definitions.
 * Contains interfaces for all major components of a GLTF asset.
 * @see {@link https://github.com/KhronosGroup/glTF?tab=readme-ov-file erview=1#glTF-2--0-specification} for more details.
 */
/**
 * Represents the root GLTF asset structure.
 * Contains references to all major components of a GLTF file.
 */
export interface GLTF {
  asset: Asset;
  scenes: Scene[];
  nodes: Node[];
  meshes: Mesh[];
  materials: Material[];
  textures: Texture[];
  images: Image[];
  samplers: Sampler[];
  animations?: Animation[];
  buffers: Buffer[];
  bufferViews: BufferView[];
  accessors: Accessor[];
  extensions: {
    // Optional root-level extension for ANT_materials_shader. When present,
    // it defines one or more named shader entries that materials can reference.
    ANT_materials_shader?: ANTMaterialsShader;
    [ext: string]: any;
  };
}

/**
 * Root object for ANT_materials_shader extension.
 * - version: extension schema version
 * - shaders: array of named shader definitions that can be referenced by materials
 */
export interface ANTMaterialsShader {
  version: string;
  shaders: ANTShader[];
}

/**
 * A single named shader definition.
 * - id: unique identifier for this shader entry (used by materials to reference it)
 * - name: optional human-friendly name for editors or debugging
 * - version: schema/version string for the shader definition
 * - shader: contains the actual shader source locations and optional metadata
 */
export interface ANTShader {
  id: string; // shader ID used for referencing
  name?: string; // optional friendly name for editors/debugging
  version: string; // shader definition schema/version
  // Separated `shader` payload describing shader sources, defines,
  // default properties and pipeline hints. See `ANTShaderSpec` for details.
  shader: ANTShaderSpec;
}

/**
 * 描述 ANT shader 的完整载荷：顶点/片段着色器来源、预处理宏、默认属性
 * 以及可选的渲染流水线提示。将此块提取为独立类型以便在解析器
 * 与 loader 中复用并保持注释与文档一致。
 */
export interface ANTShaderSpec {
  // 顶点/片段阶段支持两种形式：直接内联 source 字符串或对象引用 { uri }
  // 数组项目前使用 shape { type: 0; value: string | { uri: string } }
  vertex: [{ type: 0; value: string | { uri: string } }];
  fragment: [{ type: 0; value: string | { uri: string } }];

  // 编译时要注入的宏/定义，值可以是字符串或数字
  defines?: Record<string, string | number>;

  // 可选：顶层 properties 声明（解析器可选择更严格的 ANTUniform）
  properties?: Record<string, ANTUniform>;

  // 可选的渲染流水线提示，用于在创建运行时材质时设置透明/双面等选项
  pipeline?: {
    doubleSided?: boolean;
    alphaMode?: "OPAQUE" | "MASK" | "BLEND";
    depthTest?: boolean;
    depthWrite?: boolean;
    blending?: boolean;
    side?: number;
  };

  // 供适配器/扩展使用的保留扩展点
  extensions?: Record<string, any>;
}

/**
 * Material-level ANT extension payload.
 * Extracted as a separate type so it can be referenced throughout the codebase.
 */
export interface ANTMaterialExtension {
  shader: number; // reference to shader definition by index
  properties?: Record<string, any>;
  // fragmentUniforms?: Record<string, any>;
  description?: string;
}

/**
 * A uniform definition that can be one of:
 * - primitive number
 * - array of numbers
 * - boolean
 * - typed object describing the uniform type and its value (including textures)
 */
/**
 * Strongly-typed enum for ANT uniform types. Using an enum improves
 * discoverability and keeps code consistent when referring to uniform kinds.
 */
export enum ANTUniformType {
  Float = "float",
  Vec2 = "vec2",
  Vec3 = "vec3",
  Vec4 = "vec4",
  Mat3 = "mat3",
  Mat4 = "mat4",
  Int = "int",
  Ivec2 = "ivec2",
  Ivec3 = "ivec3",
  Ivec4 = "ivec4",
  Texture = "texture"
}

export type ANTUniform =
  | number
  | number[]
  | boolean
  | {
      type: ANTUniformType;
      value: any;
    };

/**
 * Metadata about the GLTF asset.
 */
export interface Asset {
  version: string;
  generator?: string;
  copyright?: string;
  extras?: any;
}

/**
 * Represents a scene in the GLTF asset.
 * Contains a list of node indices.
 */
export interface Scene {
  name?: string;
  nodes: number[];
}

/**
 * Represents a node in the scene graph.
 * Can reference children, transformations, mesh, camera, and skin.
 */
export interface Node {
  name?: string;
  children?: number[];
  matrix?: number[];
  rotation?: number[];
  scale?: number[];
  translation?: number[];
  mesh?: number;
  camera?: number;
  skin?: number;
  weights?: number[];
}

/**
 * Represents a mesh, which is a collection of primitives.
 */
export interface Mesh {
  name?: string;
  primitives: Primitive[];
  weights?: number[];
}

/**
 * Represents a geometric primitive in a mesh.
 * Contains attribute mappings and optional indices, material, mode, and morph targets.
 */
export interface Primitive {
  attributes: { [key: string]: number };
  indices?: number;
  material?: number;
  mode?: number;
  targets?: Target[];
}

/**
 * Represents a morph target for a primitive.
 */
export interface Target {
  [key: string]: number;
}

/**
 * Represents a material used for rendering meshes.
 */
export interface Material {
  name?: string;
  pbrMetallicRoughness?: PBRMetallicRoughness;
  extensions?: {
    ANT_materials_shader?: ANTMaterialExtension;
    [ext: string]: any;
  };
  extras?: any;
}

/**
 * Describes the PBR metallic-roughness material properties.
 */
export interface PBRMetallicRoughness {
  baseColorFactor?: number[];
  baseColorTexture?: TextureInfo;
  metallicFactor?: number;
  roughnessFactor?: number;
  metallicRoughnessTexture?: TextureInfo;
}

/**
 * Contains information about a texture reference.
 */
export interface TextureInfo {
  index: number;
  texCoord?: number;
  extensions?: any;
  extras?: any;
}

/**
 * Represents a texture, referencing an image and optional sampler.
 */
export interface Texture {
  name?: string;
  source: number;
  sampler?: number;
  extensions?: any;
  extras?: any;
}

/**
 * Represents an image used by textures.
 */
export interface Image {
  uri?: string;
  mimeType?: string;
  bufferView?: number;
  name?: string;
}

/**
 * Represents a sampler for textures, defining filtering and wrapping modes.
 */
export interface Sampler {
  magFilter?: number;
  minFilter?: number;
  wrapS?: number;
  wrapT?: number;
}

/**
 * Represents a binary buffer containing data for the asset.
 */
export interface Buffer {
  uri?: string;
  byteLength: number;
  name?: string;
}

/**
 * Represents a view into a buffer, describing a subset of the buffer's data.
 */
export interface BufferView {
  buffer: number;
  byteOffset?: number;
  byteLength: number;
  target?: number;
  name?: string;
  byteStride?: number;
}

/**
 * Represents an accessor, describing how to access data from buffer views.
 */
export interface Accessor {
  bufferView: number;
  byteOffset?: number;
  componentType: number;
  count: number;
  type: string;
  normalized?: boolean;
  min?: number[];
  max?: number[];
  name?: string;
  sparse?: SparseAccessor;
}

/**
 * Represents a sparse accessor for compressed or partial data.
 */
export interface SparseAccessor {
  count: number;
  indices: SparseIndices;
  values: SparseValues;
}

/**
 * Represents indices for a sparse accessor.
 */
export interface SparseIndices {
  bufferView: number;
  byteOffset?: number;
  componentType: number;
}

/**
 * Represents values for a sparse accessor.
 */
export interface SparseValues {
  bufferView: number;
  byteOffset?: number;
}

/**
 * Represents an animation, containing channels and samplers.
 */
export interface Animation {
  name?: string;
  channels: AnimationChannel[];
  samplers: AnimationSampler[];
}

/**
 * Represents an animation channel, mapping a sampler to a target.
 */
export interface AnimationChannel {
  sampler: number;
  target: AnimationTarget;
}

/**
 * Represents the target of an animation channel.
 */
export interface AnimationTarget {
  node: number;
  path: string;
}

/**
 * Represents an animation sampler, describing input/output data and interpolation.
 */
export interface AnimationSampler {
  input: number;
  output: number;
  interpolation?: string;
}
