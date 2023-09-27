import { Router } from "express";
import cors from "cors";
import { getConfigFile, parseCorsOrigins } from "medusa-core-utils";
import { ConfigModule } from "@medusajs/medusa/dist/types/global";

export default (rootDirectory, options) => {
    const router = Router();
    const { configModule } = getConfigFile<ConfigModule>(
        rootDirectory,
        "medusa-config",
    );
    const { projectConfig } = configModule;
    const storeCorsOptions = {
        origin: projectConfig.store_cors?.split(",") ?? [],
        credentials: true,
    };
    router.use(cors(storeCorsOptions));

    return router;
};
