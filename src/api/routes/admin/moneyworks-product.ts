import { wrapHandler } from '@medusajs/medusa';
import { Router } from 'express';
import MoneyworksProductService from '../../../services/moneyworks-product';

export default (router: Router, rootDirectory, options) => {
    router.post("/products/sync", wrapHandler(async (req, res) => {
        const mwProductService: MoneyworksProductService = req.scope.resolve("moneyworksProductService");
        await mwProductService.syncAllInventoryFromMoneyworks();
        res.json({ success: true });
    }))
}
