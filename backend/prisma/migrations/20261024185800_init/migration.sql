-- CreateTable
CREATE TABLE "Station" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'Delhi NCR',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "openaqId" TEXT,
    "openaqSensorIds" JSONB,
    "source" TEXT NOT NULL DEFAULT 'OpenAQ',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Station_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PollutionObservation" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "pollutant" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'µg/m³',
    "source" TEXT NOT NULL DEFAULT 'OpenAQ',
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PollutionObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeatherObservation" (
    "id" TEXT NOT NULL,
    "stationId" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "temperature" DOUBLE PRECISION,
    "humidity" DOUBLE PRECISION,
    "windSpeed" DOUBLE PRECISION,
    "windDirection" DOUBLE PRECISION,
    "precipitation" DOUBLE PRECISION,
    "pressure" DOUBLE PRECISION,
    "boundaryLayerHeight" DOUBLE PRECISION,
    "source" TEXT NOT NULL DEFAULT 'Open-Meteo-ERA5',
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeatherObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Forecast" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL,
    "forecastTime" TIMESTAMP(3) NOT NULL,
    "leadHours" INTEGER NOT NULL,
    "pollutant" TEXT NOT NULL DEFAULT 'pm25',
    "predictedValue" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'µg/m³',
    "modelVersion" TEXT NOT NULL,
    "lowerBound" DOUBLE PRECISION,
    "upperBound" DOUBLE PRECISION,
    "dataQuality" TEXT NOT NULL DEFAULT 'ok',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Forecast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelEvaluation" (
    "id" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "pollutant" TEXT NOT NULL,
    "trainingPeriod" TEXT NOT NULL,
    "testPeriod" TEXT NOT NULL,
    "leadHours" INTEGER NOT NULL,
    "mae" DOUBLE PRECISION NOT NULL,
    "rmse" DOUBLE PRECISION NOT NULL,
    "r2" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModelEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataRefreshLog" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "recordsInserted" INTEGER NOT NULL DEFAULT 0,
    "errorSummary" TEXT,

    CONSTRAINT "DataRefreshLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Station_openaqId_key" ON "Station"("openaqId");

-- CreateIndex
CREATE INDEX "Station_latitude_longitude_idx" ON "Station"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "PollutionObservation_stationId_timestamp_idx" ON "PollutionObservation"("stationId", "timestamp");

-- CreateIndex
CREATE INDEX "PollutionObservation_pollutant_timestamp_idx" ON "PollutionObservation"("pollutant", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "PollutionObservation_stationId_timestamp_pollutant_key" ON "PollutionObservation"("stationId", "timestamp", "pollutant");

-- CreateIndex
CREATE INDEX "WeatherObservation_timestamp_idx" ON "WeatherObservation"("timestamp");

-- CreateIndex
CREATE INDEX "WeatherObservation_stationId_timestamp_idx" ON "WeatherObservation"("stationId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "WeatherObservation_latitude_longitude_timestamp_key" ON "WeatherObservation"("latitude", "longitude", "timestamp");

-- CreateIndex
CREATE INDEX "Forecast_stationId_issuedAt_idx" ON "Forecast"("stationId", "issuedAt");

-- CreateIndex
CREATE INDEX "Forecast_forecastTime_idx" ON "Forecast"("forecastTime");

-- CreateIndex
CREATE UNIQUE INDEX "Forecast_stationId_issuedAt_forecastTime_pollutant_modelVer_key" ON "Forecast"("stationId", "issuedAt", "forecastTime", "pollutant", "modelVersion");

-- CreateIndex
CREATE UNIQUE INDEX "ModelEvaluation_modelName_pollutant_leadHours_key" ON "ModelEvaluation"("modelName", "pollutant", "leadHours");

-- CreateIndex
CREATE INDEX "DataRefreshLog_source_startedAt_idx" ON "DataRefreshLog"("source", "startedAt");

-- AddForeignKey
ALTER TABLE "PollutionObservation" ADD CONSTRAINT "PollutionObservation_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeatherObservation" ADD CONSTRAINT "WeatherObservation_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Forecast" ADD CONSTRAINT "Forecast_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
