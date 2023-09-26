import { authenticate } from "@medusajs/medusa";
import { Router } from "express";
import moneyWorksProductRouter from "./moneyworks-product";

export default (rootDirectory, options) => {
    const router = Router();

    router.use(authenticate());

    moneyWorksProductRouter(router, rootDirectory, options);

    return router;
};
