import IORedis from "ioredis";
import type { ProtocolEvent } from "@jevo/protocol-types";
import { env } from "../config/env";
import { logger } from "../observability/logger";

export const PROTOCOL_EVENTS_CHANNEL = "protocol-events";

let publisher: IORedis | null = null;
let subscriber: IORedis | null = null;

const eventListeners = new Set<(event: ProtocolEvent) => void>();

/**
 * Returns the singleton Redis publisher instance.
 */
export function getEventPublisher(): IORedis {
  if (!publisher) {
    publisher = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
    publisher.on("error", (err) => {
      logger.error({ err }, "Redis event bus publisher error");
    });
  }
  return publisher;
}

/**
 * Publishes a ProtocolEvent to the Redis pub/sub channel.
 * Implements the publish-after-commit pattern.
 */
export async function publishProtocolEvent(event: ProtocolEvent): Promise<number> {
  try {
    const pub = getEventPublisher();
    const payload = JSON.stringify(event);
    const subscriberCount = await pub.publish(PROTOCOL_EVENTS_CHANNEL, payload);
    logger.debug(
      { eventId: event.eventId, eventType: event.eventType, subscriberCount },
      "Published protocol event to Redis bus",
    );
    return subscriberCount;
  } catch (err) {
    logger.error({ err, eventId: event.eventId }, "Failed to publish protocol event to Redis");
    return 0;
  }
}

/**
 * Ensures the shared Redis subscriber connection is initialized and subscribed.
 */
function ensureSubscriber(): IORedis {
  if (!subscriber) {
    subscriber = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    subscriber.on("error", (err) => {
      logger.error({ err }, "Redis event bus subscriber error");
    });

    subscriber.on("message", (channel, message) => {
      if (channel !== PROTOCOL_EVENTS_CHANNEL) return;

      try {
        const event = JSON.parse(message) as ProtocolEvent;
        for (const listener of eventListeners) {
          try {
            listener(event);
          } catch (listenerErr) {
            logger.error({ listenerErr }, "Error in protocol event listener");
          }
        }
      } catch (err) {
        logger.error({ err, message }, "Failed to parse protocol event message from Redis");
      }
    });

    subscriber.subscribe(PROTOCOL_EVENTS_CHANNEL, (err, count) => {
      if (err) {
        logger.error({ err }, "Failed to subscribe to protocol-events channel");
      } else {
        logger.info({ count }, "Subscribed to Redis protocol-events channel");
      }
    });
  }
  return subscriber;
}

/**
 * Subscribes a listener callback to live ProtocolEvents received via Redis pub/sub.
 * Returns an unsubscribe cleanup function.
 */
export function subscribeToProtocolEvents(
  listener: (event: ProtocolEvent) => void,
): () => void {
  ensureSubscriber();
  eventListeners.add(listener);

  return () => {
    eventListeners.delete(listener);
  };
}

/**
 * Cleanly closes the event bus connections on shutdown.
 */
export async function closeEventBus(): Promise<void> {
  eventListeners.clear();

  if (subscriber) {
    try {
      await subscriber.unsubscribe(PROTOCOL_EVENTS_CHANNEL);
      await subscriber.quit();
    } catch {
      // ignore
    }
    subscriber = null;
  }

  if (publisher) {
    try {
      await publisher.quit();
    } catch {
      // ignore
    }
    publisher = null;
  }
}
