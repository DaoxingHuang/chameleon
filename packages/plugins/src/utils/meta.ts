/**
 *
 * Common helpers for RenderingContext.metadata:
 * - initialize the metadata structure
 * - provide utilities for stage locks, cleanup registration, and completion flags
 */

export type StageName = string;
export type StageCleanupFn = (ctx: any) => Promise<void> | void;

// NOTE: keep the original dynamic shape; RenderingContext is expected to exist in the runtime environment.
type MetadataType = typeof RenderingContext.prototype.metadata;

/**
 * ensureMetadata
 * - Ensure ctx.metadata exists and has the common sub-objects:
 *   - stageLocks: record boolean lock state per stage
 *   - stageCleanups: array of cleanup functions per stage
 *   - stagesCompleted: record boolean completed state per stage
 * - Returns the metadata object for convenience.
 */
export function ensureMetadata(ctx: RenderingContext): MetadataType {
  ctx.metadata = ctx.metadata || {};
  ctx.metadata.stageLocks = ctx.metadata.stageLocks || {};
  ctx.metadata.stageCleanups = ctx.metadata.stageCleanups || {};
  ctx.metadata.stagesCompleted = ctx.metadata.stagesCompleted || {};
  return ctx.metadata;
}

/**
 * isStageLocked
 * - Return true if the named stage is currently locked on the given context.
 */
export function isStageLocked(ctx: RenderingContext, stage: StageName): boolean {
  ensureMetadata(ctx);
  return !!ctx.metadata.stageLocks[stage];
}

/**
 * lockStage
 * - Mark the named stage as locked on the context (prevents concurrent execution).
 */
export function lockStage(ctx: RenderingContext, stage: StageName) {
  ensureMetadata(ctx);
  ctx.metadata.stageLocks[stage] = true;
}

/**
 * unlockStage
 * - Release the named stage lock on the context.
 */
export function unlockStage(ctx: RenderingContext, stage: StageName) {
  ensureMetadata(ctx);
  ctx.metadata.stageLocks[stage] = false;
}

/**
 * addStageCleanup
 * - Register a cleanup function to run when the given stage is cleaned up/disposed.
 * - Cleanup functions are executed with the same ctx parameter.
 */
export function addStageCleanup(ctx: RenderingContext, stage: StageName, fn: StageCleanupFn) {
  ensureMetadata(ctx);
  ctx.metadata.stageCleanups[stage] = ctx.metadata.stageCleanups[stage] || [];
  ctx.metadata.stageCleanups[stage].push(fn);
}

/**
 * runStageCleanups
 * - Execute all cleanup functions registered for the named stage.
 * - Each cleanup is awaited; errors in individual cleanups are caught and logged.
 */
export async function runStageCleanups(ctx: RenderingContext, stage: StageName) {
  const list: StageCleanupFn[] = (ctx.metadata?.stageCleanups?.[stage]) || [];
  for (const fn of list) {
    try {
      await fn(ctx);
    } catch (e) {
      try { console.error(`[metadata] cleanup failed for stage ${stage}`, e); } catch {}
    }
  }
}

/**
 * markStageCompleted
 * - Set a boolean marker indicating whether the stage has completed.
 */
export function markStageCompleted(ctx: RenderingContext, stage: StageName, completed = true) {
  ensureMetadata(ctx);
  ctx.metadata.stagesCompleted[stage] = completed;
}

/**
 * clearStageCleanups
 * - Clear registered cleanup functions for the named stage.
 */
export function clearStageCleanups(ctx: RenderingContext, stage: StageName) {
  ensureMetadata(ctx);
  ctx.metadata.stageCleanups[stage] = [];
}