import { wrapHandler } from '@medusajs/medusa';
import { Router } from 'express';
import MoneyworksProductService from '../../../services/moneyworks-product';

export default (router: Router, rootDirectory, options) => {
    router.post("/moneyworks-products/sync", wrapHandler(async (req, res) => {
        const mwProductService: MoneyworksProductService = req.scope.resolve("MoneyworksProductService ");
        await mwProductService.syncAllInventoryFromMoneyworks();
    }))
}
