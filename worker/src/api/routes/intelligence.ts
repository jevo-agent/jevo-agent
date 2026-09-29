import type { FastifyPluginAsync } from "fastify";
import { jevoIntelligenceFacade, getProviderModeInfo } from "../../intelligence/facade";
import { formatResponse } from "../envelope";

export interface StockParams {
  symbol: string;
}

export interface DecisionParams {
  id: string;
}

export interface OpportunitiesQuery {
  limit?: string;
  sort?: "rank" | "score";
  decision?: string;
  [key: string]: unknown;
}

export interface PairingsQuery {
  symbol?: string;
  limit?: string;
  [key: string]: unknown;
}

export interface ActivityQuery {
  subjectId?: string;
  subjectType?: string;
  limit?: string;
  [key: string]: unknown;
}

export const intelligenceRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/v1/intelligence/stocks/:symbol
  fastify.get<{ Params: StockParams }>("/stocks/:symbol", async (request, reply) => {
    const rawSymbol = request.params.symbol;
    if (!rawSymbol || rawSymbol.trim().length === 0) {
      return reply.status(400).send({ message: "Symbol parameter required" });
    }

    const stock = await jevoIntelligenceFacade.getStockState(rawSymbol);
    if (!stock) {
      return reply.status(404).send({ message: `Stock ${rawSymbol} not found` });
    }

    return reply.send(
      formatResponse(stock, {
        providerMode: getProviderModeInfo(),
      } as Record<string, unknown>),
    );
  });

  // GET /api/v1/intelligence/opportunities
  fastify.get<{ Querystring: OpportunitiesQuery }>("/opportunities", async (request, reply) => {
    const query = request.query ?? {};
    const limit = query.limit ? parseInt(query.limit, 10) : undefined;

    const opportunities = await jevoIntelligenceFacade.getOpportunities({
      limit: !isNaN(limit as number) ? limit : undefined,
      sort: query.sort,
      decision: query.decision,
    });

    return reply.send(
      formatResponse(opportunities, {
        total: opportunities.length,
        providerMode: getProviderModeInfo(),
      } as Record<string, unknown>),
    );
  });

  // GET /api/v1/intelligence/pairings
  fastify.get<{ Querystring: PairingsQuery }>("/pairings", async (request, reply) => {
    const query = request.query ?? {};
    const limit = query.limit ? parseInt(query.limit, 10) : undefined;

    const pairings = await jevoIntelligenceFacade.getPairings({
      symbol: query.symbol,
      limit: !isNaN(limit as number) ? limit : undefined,
    });

    return reply.send(
      formatResponse(pairings, {
        total: pairings.length,
        providerMode: getProviderModeInfo(),
      } as Record<string, unknown>),
    );
  });

  // GET /api/v1/intelligence/activity
  // CRITICAL: Does NOT fall back to NVDA when subjectId is omitted.
  fastify.get<{ Querystring: ActivityQuery }>("/activity", async (request, reply) => {
    const query = request.query ?? {};
    const limit = query.limit ? parseInt(query.limit, 10) : undefined;

    const activities = await jevoIntelligenceFacade.getActivity({
      subjectId: query.subjectId,
      subjectType: query.subjectType,
      limit: !isNaN(limit as number) ? limit : undefined,
    });

    return reply.send(
      formatResponse(activities, {
        total: activities.length,
        providerMode: getProviderModeInfo(),
      } as Record<string, unknown>),
    );
  });

  // GET /api/v1/intelligence/decisions/:id
  fastify.get<{ Params: DecisionParams }>("/decisions/:id", async (request, reply) => {
    const rawId = request.params.id;
    if (!rawId || rawId.trim().length === 0) {
      return reply.status(400).send({ message: "Decision ID parameter required" });
    }

    const decision = await jevoIntelligenceFacade.getDecision(rawId);
    if (!decision) {
      return reply.status(404).send({ message: `Decision ${rawId} not found` });
    }

    return reply.send(
      formatResponse(decision, {
        providerMode: getProviderModeInfo(),
      } as Record<string, unknown>),
    );
  });
};
