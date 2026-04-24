import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getStats = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenant?.id;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const [labCount, geneticsCount, activeBatchCount, alertCount, recentMeasurements] =
      await Promise.all([
        prisma.lab.count({ where: { tenantId } }),
        prisma.genetics.count(),
        prisma.batch.count({
          where: { tenantId, NOT: { state: 'harvested' } },
        }),
        // Count measurements outside thresholds as alerts
        prisma.measurement.count({
          where: {
            batch: { tenantId },
            OR: [
              { type: 'temperature', value: { gt: 27 } },
              { type: 'humidity', value: { gt: 80 } },
              { type: 'humidity', value: { lt: 40 } },
              { type: 'ph', value: { gt: 6.5 } },
              { type: 'ph', value: { lt: 5.5 } },
            ],
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        }),
        prisma.measurement.findMany({
          where: { batch: { tenantId } },
          orderBy: { createdAt: 'desc' },
          take: 4,
        }),
      ]);

    res.json({
      stats: {
        activeBatches: activeBatchCount,
        genetics: geneticsCount,
        labs: labCount,
        alerts: alertCount,
      },
      recentMeasurements,
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ error: 'Failed to get dashboard stats' });
  }
};

export const getActivity = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenant?.id;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    // Get recent operations as activity feed
    const recentOperations = await prisma.operation.findMany({
      where: { tenantId },
      include: {
        batch: { select: { code: true } },
        lab: { select: { name: true } },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Get recently created batches
    const recentBatches = await prisma.batch.findMany({
      where: { tenantId },
      include: {
        genetics: { select: { name: true } },
        lab: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Merge and sort by date
    const activity = [
      ...recentOperations.map((op) => ({
        id: op.id,
        type: 'operation' as const,
        description: `${op.type} — ${op.batch?.code || 'N/A'}`,
        detail: `${op.lab?.name || ''} • ${op.user?.name || ''}`,
        createdAt: op.createdAt,
      })),
      ...recentBatches.map((b) => ({
        id: b.id,
        type: 'batch' as const,
        description: `Nuevo batch: ${b.code}`,
        detail: `${b.genetics?.name || ''} • ${b.lab?.name || ''}`,
        createdAt: b.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    res.json({ activity });
  } catch (err) {
    console.error('Error fetching dashboard activity:', err);
    res.status(500).json({ error: 'Failed to get dashboard activity' });
  }
};
