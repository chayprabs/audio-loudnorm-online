export interface AsyncJobResponse {
  job_id: string;
  status: string;
}

export interface AsyncJobStatus<T = unknown> {
  id: string;
  feature: string;
  status: string;
  progress: number;
  result: T | null;
  error: string | null;
  expires_at: string;
}

export async function pollJob<T>(
  getJob: () => Promise<AsyncJobStatus<T>>,
  onUpdate?: (job: AsyncJobStatus<T>) => void,
): Promise<AsyncJobStatus<T>> {
  for (;;) {
    const job = await getJob();
    onUpdate?.(job);
    if (job.status === "completed" || job.status === "failed" || job.status === "cancelled") {
      return job;
    }
    await new Promise((resolve) => setTimeout(resolve, 1200));
  }
}
