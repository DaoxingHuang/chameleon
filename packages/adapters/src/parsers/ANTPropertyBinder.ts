import type { ANTUniform } from "@chameleon/core";
import { BaseMaterial, Color, GLTFParserContext, GLTFParserType, Texture2D } from "@galacean/engine";

// Allowed ANT uniform type strings (used at runtime for robust comparisons).
const ALLOWED_ANT_UNIFORM_TYPES: string[] = [
  "float",
  "vec2",
  "vec3",
  "vec4",
  "mat3",
  "mat4",
  "int",
  "ivec2",
  "ivec3",
  "ivec4",
  "texture",
  "color"
];

/**
 * Apply ANT `properties` to a shader material's shaderData.
 *
 * This helper implements binding for common ANT uniform shapes declared in
 * the GLTF `ANT_materials_shader` properties map. It is conservative and
 * resilient: it attempts engine-specific shaderData setters when available
 * and falls back to generic `setFloat`, `setFloatArray` and `setTexture`.
 *
 * Supported types (based on ANTUniform and common usage):
 * - float
 * - vec2, vec3, vec4
 * - mat3, mat4
 * - int, ivec2/3/4
 * - texture (or type: 'texture')
 * - boolean (mapped to float 0/1)
 *
 * The function expects the `properties` entries to follow the pattern used
 * in the parser: either a primitive value (number / array) or a typed object
 * with `type` and `value` fields. Texture descriptors may be a numeric index
 * or an object with `index`.
 */
export async function applyANTPropertiesToShader(
  shaderMaterial: BaseMaterial,
  ext: { properties?: Record<string, ANTUniform> } | null | undefined,
  context: GLTFParserContext
) {
  if (!ext || !ext.properties) return;

  const props: Record<string, ANTUniform> = ext.properties || {};
  for (const k of Object.keys(props)) {
    const p = props[k];
    // rawVal is the user value (or the typed .value)
    const isTypedObject = typeof p === "object" && p !== null && "value" in p;
    const rawVal = isTypedObject ? (p as any).value : (p as ANTUniform);

    // Determine a normalized ANTUniformType when possible. The property may
    // carry either the enum value (from TypeScript sources) or a raw string
    // from parsed JSON. We try to map both to the ANTUniformType enum.
    // Uniform type as a runtime string (one of ALLOWED_ANT_UNIFORM_TYPES) when present
    let uniformType: string | null = null;
    if (isTypedObject) {
      const t = (p as any).type;
      if (typeof t === "string") {
        const lc = t.toLowerCase();
        if (ALLOWED_ANT_UNIFORM_TYPES.includes(lc)) uniformType = lc;
      } else if (typeof t === "number") {
        // unlikely but guard against numeric enums — fall back to string
        try {
          const s = String(t);
          if (ALLOWED_ANT_UNIFORM_TYPES.includes(s)) uniformType = s;
        } catch {}
      }
    }

    console.log(`ANTPropertyBinder: binding property '${k}' type='${uniformType}' value=`, rawVal);

    // Helper to set a float scalar
    const setFloat = (name: string, v: number) => {
      try {
        shaderMaterial.shaderData.setFloat(name, v);
        return true;
      } catch {
        return false;
      }
    };

    const setColor = (name: string, arr: Float32Array) => {
      console.log("setColor", name, arr);
      try {
        //    materialShaderData.setColor(
        //     key,
        //     new Color((<IColor>value).r, (<IColor>value).g, (<IColor>value).b, (<IColor>value).a)
        //   );
        shaderMaterial.shaderData.setColor(name, new Color(arr[0], arr[1], arr[2], arr.length >= 4 ? arr[3] : 1.0));
        return true;
      } catch {
        return false;
      }
    };

    // Helper to set float array (vec/mat)
    const setFloatArray = (name: string, arr: Float32Array) => {
      console.log("setFloatArray", name, arr);
      try {
        shaderMaterial.shaderData.setFloatArray(name, arr);
        return true;
      } catch {
        return false;
      }
    };

    // Helper to set texture by resolving via GLTF parser context
    const setTexture = async (name: string, descriptor: number | { index?: number } | null | undefined) => {
      try {
        const texIndex = typeof descriptor === "number" ? descriptor : descriptor && descriptor.index;
        if (typeof texIndex !== "number") return false;
        const texture = await context.get<Texture2D>(GLTFParserType.Texture, texIndex);
        shaderMaterial.shaderData.setTexture(name, texture);
        return true;
      } catch {
        return false;
      }
    };

    // Normalize boolean -> float
    if (typeof rawVal === "boolean") {
      setFloat(k, rawVal ? 1 : 0);
      continue;
    }

    // If the declared uniform type is texture, bind as texture immediately.
    if (uniformType === "texture") {
      await setTexture(k, rawVal as any);
      continue;
    }

    // Numbers -> float
    if (typeof rawVal === "number") {
      // try setFloat first
      if (setFloat(k, rawVal)) continue;
      // fallback to float array of length 1
      try {
        setFloatArray(k, new Float32Array([rawVal]));
      } catch {}
      continue;
    }

    // Arrays -> vectors or matrices
    // if (Array.isArray(rawVal)) {
    //   try {
    //     // For vec2/3/4 and matrices, set as Float32Array via setFloatArray.
    //     setFloatArray(k, new Float32Array(rawVal));
    //     continue;
    //   } catch {
    //     // ignore and fallthrough
    //   }
    // }

    // If value is an object, try applying based on the declared uniform type
    if (rawVal && typeof rawVal === "object") {
      // If the declared type is available, prefer that.
      if (uniformType) {
        switch (uniformType) {
          case "color": {
            await setColor(k, rawVal);
            continue;
          }

          case "texture": {
            await setTexture(k, rawVal as any);
            continue;
          }
          case "float":
          case "int": {
            if (typeof rawVal === "number") {
              setFloat(k, rawVal as number);
              continue;
            }
            break;
          }
          case "vec2":
          case "vec3":
          case "vec4":
          case "mat3":
          case "mat4": {
            if (Array.isArray(rawVal)) {
              try {
                setFloatArray(k, new Float32Array(rawVal));
                continue;
              } catch {}
            }
            break;
          }
          default:
            break;
        }
      }

      // Heuristic: if object contains index -> treat as texture
      if (typeof (rawVal as any).index === "number") {
        await setTexture(k, rawVal as any);
        continue;
      }

      // Heuristic: numeric arrays stored under .value
      if (Array.isArray((rawVal as any).value)) {
        try {
          setFloatArray(k, new Float32Array((rawVal as any).value));
          continue;
        } catch {}
      }

      // Unknown object shape: attempt to stringify number-like entries
      //   try {
      //     const numeric = Object.keys(rawVal)
      //       .map((kk) => (typeof (rawVal as any)[kk] === "number" ? (rawVal as any)[kk] : null))
      //       .filter((v) => v !== null) as number[];
      //     if (numeric.length > 0) {
      //       setFloatArray(k, new Float32Array(numeric));
      //       continue;
      //     }
      //   } catch {}
    }

    // Last resort: if property looks like a texture index (number or {index})
    if (typeof rawVal === "number") {
      await setTexture(k, rawVal);
      continue;
    }
  }
}

export default applyANTPropertiesToShader;
