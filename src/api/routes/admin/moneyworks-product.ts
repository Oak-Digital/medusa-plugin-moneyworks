import { Router } from "express";
import { wrapHandler } from "@medusajs/medusa";
import { MedusaError } from "@medusajs/utils";
import MoneyworksProductService from "../../../services/moneyworks-product";

export default (router: Router, rootDirectory, options) => {
    router.get("/moneyworks-products", wrapHandler(async (req, res) => {
        // TODO: make medusa figure out the type by itself
        const mwProductService: MoneyworksProductService = req.scope.resolve("moneyworksProductService");
        const mwProducts = await mwProductService.list();
        res.json({ mwProducts });
    }));

    router.post("/moneyworks-products/sync", wrapHandler(async (req, res) => {
        const mwProductService: MoneyworksProductService = req.scope.resolve("moneyworksProductService");
        try {
            await mwProductService.syncAllFromMoneyworks();
        } catch (e) {
            throw new MedusaError(MedusaError.Types.DB_ERROR, "Could not sync products from Moneyworks");
        }
        res.json({ success: true });
    }));
};
