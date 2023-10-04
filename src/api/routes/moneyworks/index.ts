import { MedusaError } from '@medusajs/utils'
import { Router } from "express";
import addInvoiceCreated from "./invoice-created";

export default (rootDirectory, options) => {
    const router = Router();

    addInvoiceCreated(router, rootDirectory, options);

    router.use((req, res, next) => {
        const token = req.headers.authorization?.split(" ")[1];

        if (!options.moneyworksSecret) {
            // Should not be a 400, since this is a servcer configuration thing.
            throw new Error("No moneyworks secret set");
        }

        if (token !== options.moneyworksSecret) {
            throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Invalid token");
        }

        next();
    });

    return router;
};
