import { authenticate } from "@medusajs/medusa";
import { Router } from "express";
import moneyworksProductRouter from "./moneyworks-product";

export default (rootDirectory, options) => {
    const router = Router();

    router.use(authenticate());

    moneyworksProductRouter(router, rootDirectory, options);

    return router;
};
