-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TuyaDevice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "tuyaDeviceId" TEXT NOT NULL,
    "name" TEXT,
    "category" TEXT,
    "isOnline" BOOLEAN DEFAULT false,
    "raw" TEXT NOT NULL,
    "labId" TEXT,
    "lastSyncAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TuyaDevice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TuyaDevice_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_TuyaDevice" ("category", "createdAt", "id", "isOnline", "lastSyncAt", "name", "raw", "tenantId", "tuyaDeviceId", "updatedAt") SELECT "category", "createdAt", "id", "isOnline", "lastSyncAt", "name", "raw", "tenantId", "tuyaDeviceId", "updatedAt" FROM "TuyaDevice";
DROP TABLE "TuyaDevice";
ALTER TABLE "new_TuyaDevice" RENAME TO "TuyaDevice";
CREATE UNIQUE INDEX "TuyaDevice_tuyaDeviceId_key" ON "TuyaDevice"("tuyaDeviceId");
CREATE INDEX "TuyaDevice_tenantId_idx" ON "TuyaDevice"("tenantId");
CREATE INDEX "TuyaDevice_tuyaDeviceId_idx" ON "TuyaDevice"("tuyaDeviceId");
CREATE INDEX "TuyaDevice_labId_idx" ON "TuyaDevice"("labId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
