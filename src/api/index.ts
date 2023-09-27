import express, { Router } from "express";
import adminRouter from "./routes/admin";
import storeRouter from "./routes/store";
import { errorHandler } from "@medusajs/medusa";

export default (rootDirectory, options) => {
    const router = Router();

    router.use(express.json())
    router.use(express.urlencoded({ extended: true }))

    const adminRouterInstance = adminRouter(rootDirectory, options);
    // TODO: fix route
    router.use("/admin/x", adminRouterInstance);
    // router.use("/store", storeRouter(rootDirectory, options));

    router.use(errorHandler());

    return router;
};
