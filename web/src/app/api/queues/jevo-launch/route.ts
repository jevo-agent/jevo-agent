import { handleCallback, dispatchLaunchToWorker, retryQueueDelivery } from "@/lib/queue/jevo";

const queueHandler = handleCallback(
  async (message) => {
    await dispatchLaunchToWorker(message);
  },
  { retry: retryQueueDelivery, visibilityTimeoutSeconds: 900 },
);

export async function POST(request: Request): Promise<Response> {
  return queueHandler(request);
}
