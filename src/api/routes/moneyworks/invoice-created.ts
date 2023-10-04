import { wrapHandler } from "@medusajs/medusa";
import { Router } from "express";
import { Options } from "../../../lib/options";
import MoneyworksInvoiceService from "../../../services/moneyworks-invoice";
import { StatusCodes } from "http-status-codes";
import { TypedRequestBody, validateRequest } from "zod-express-middleware";
import { z } from "zod";

export default (router: Router, rootDirectory, options: Options) => {
    const invoiceCreatedSchema = z.object({
        invoiceId: z.string().or(z.number()),
        orderId: z.coerce.number(),
    });

    router.post(
        "/invoice-created",
        validateRequest({
            body: invoiceCreatedSchema,
        }),
        wrapHandler(async (req: TypedRequestBody<typeof invoiceCreatedSchema>, res) => {
            const { invoiceId, orderId } = req.body;
            const mwInvoiceService: MoneyworksInvoiceService = req.scope.resolve(
                "moneyworksInvoiceService",
            );

            await mwInvoiceService.invoiceReady(invoiceId, orderId);

            res.status(StatusCodes.ACCEPTED);
            res.json({ success: true });
        }),
    );
};
