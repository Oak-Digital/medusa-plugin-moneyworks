import { authenticate } from "@medusajs/medusa";
import { Router } from "express";

export default (rootDirectory, options) => {
    const router = Router();

    router.use(authenticate());

    return router;
};
