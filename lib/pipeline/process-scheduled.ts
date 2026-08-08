import "server-only";

import { fetchJobHtml } from "@/lib/oxylabs/client";
import { listScheduleRuns } from "@/lib/oxylabs/scheduler";
import { listSchedules } from "@/lib/data/schedules";
import {
  updateRunResultStatus,
  upsertScheduleRun,
} from "@/lib/data/schedule-runs";
import { writeLog } from "@/lib/data/logs";
import { runScrapePipeline } from "./scrape";
import type { RunSummary } from "./run-summary";
import { syncOxylabsSchedules } from "./schedule-sync";

/**
 * Scheduler result processing (AGENTS.md section 18). Step one of the
 * automatic pipeline:
 *  1. sync schedules from active sources (create any missing ones),
 *  2. pull each schedule's runs, keep only `result_status === "done"` jobs,
 *  3. fetch each done job's HTML and feed it to the shared scrape pipeline as
 *     the listing HTML (never saved raw),
 *  4. return the pipeline run summary.
 *
 * Never stores raw scheduled listing results as products, and never duplicates
 * pipeline logic — validation, cleanup, dedupe, and logging all live in the
 * shared pipeline module.
 */

export interface ProcessResult {
  summary: RunSummary;
  runs_checked: number;
  done_jobs_processed: number;
}

export async function processScheduledResults(): Promise<ProcessResult> {
  await writeLog("info", "pipeline/process-scheduled", "scheduled result processing started");

  // 1. Make sure every active source has a schedule before consuming runs.
  await syncOxylabsSchedules();

  const schedules = await listSchedules();
  const listingHtmlBySource = new Map<string, string>();
  let runsChecked = 0;
  let doneJobsProcessed = 0;

  for (const schedule of schedules) {
    let runs: Awaited<ReturnType<typeof listScheduleRuns>>;
    try {
      runs = await listScheduleRuns(schedule.oxylabs_schedule_id);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await writeLog("error", "pipeline/process-scheduled", `failed to list runs for schedule`, {
        schedule_id: schedule.id,
        oxylabs_schedule_id: schedule.oxylabs_schedule_id,
        message,
      });
      continue;
    }

    for (const run of runs) {
      runsChecked += 1;
      const runRow = await upsertScheduleRun({
        schedule_id: schedule.id,
        oxylabs_run_id: run.runId,
        status: "completed",
      });

      for (const job of run.jobs) {
        if (job.resultStatus !== "done") continue;

        await writeLog("info", "pipeline/process-scheduled", "fetching done job HTML", {
          job_id: job.jobId,
          run_id: run.runId,
        });
        const result = await fetchJobHtml(job.jobId);
        listingHtmlBySource.set(schedule.source_id, result.content);

        if (runRow) {
          await updateRunResultStatus(runRow.id, "done");
        }
        doneJobsProcessed += 1;
      }
    }
  }

  await writeLog("info", "pipeline/process-scheduled", "runs consumed", {
    runs_checked: runsChecked,
    done_jobs_processed: doneJobsProcessed,
    sources_with_listing_html: listingHtmlBySource.size,
  });

  const summary = await runScrapePipeline({
    source: "scheduled",
    listingHtmlBySource,
  });

  return { summary, runs_checked: runsChecked, done_jobs_processed: doneJobsProcessed };
}
