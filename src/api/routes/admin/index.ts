import { authenticate } from "@medusajs/medusa";
import { Router } from "express";
import moneyworksProductRouter from "./moneyworks-product";
import cors from "cors";
import { getConfigFile, parseCorsOrigins } from "medusa-core-utils";
import { ConfigModule } from "@medusajs/medusa/dist/types/global";

export default (rootDirectory, options) => {
    const { configModule } = getConfigFile<ConfigModule>(
        rootDirectory,
        "medusa-config",
    );
    const { projectConfig } = configModule;
    const adminCorsOptions = {
        origin: projectConfig.admin_cors?.split(",") ?? [],
        credentials: true,
    };

    const router = Router();

    router.use(cors(adminCorsOptions));
    router.use(authenticate());

    moneyworksProductRouter(router, rootDirectory, options);

    return router;
};
