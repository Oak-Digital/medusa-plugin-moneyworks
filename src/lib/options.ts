import { z } from "zod";

export const optionsSchema = z.object({
    host: z.string(),
    port: z.coerce.number().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    dataFile: z.string(),
    dataFileUsername: z.string().optional(),
    dataFilePassword: z.string().optional(),
    scheduledSyncString: z.string().default("0 0 2 ? * * *").or(z.null()),
    moneyworksSecret: z.string().optional(),
    invoiceForm: z.string().optional(),
    defaultContra: z.string().or(z.number()).optional(),
    handlebars: z.any().optional(),
    transactionNameCodeTemplate: z.string().optional(),
    transactionStockLocationTemplate: z.string().optional(),
});

export type Options = z.infer<typeof optionsSchema>;
