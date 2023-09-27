import {
    buildQuery,
    FindConfig,
    ProductVariant,
    Selector,
    TransactionBaseService,
} from "@medusajs/medusa";
import { MedusaError } from "@medusajs/utils";
import { Repository } from "typeorm";
import { MoneyWorksClient } from "@oak-digital/moneyworks";
import { z } from "zod";

export type MoneyworksProductData = {
    product_code: string;
};

const optionsSchema = z.object({
    host: z.string(),
    port: z.number().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    dataFile: z.string(),
    dataFileUsername: z.string().optional(),
    dataFilePassword: z.string().optional(),
});

const moneyworksProductSchema = z.object({
    code: z.string().optional(),
    stockonhand: z.coerce.number().optional(),
    bardcode: z.string().optional(),
});

class MoneyworksProductService extends TransactionBaseService {
    protected client: MoneyWorksClient;
    protected variantRepository: Repository<ProductVariant>;

    constructor(container: any, options: Record<string, unknown>) {
        super(container);
        const parsedOptions = optionsSchema.parse(options);
        this.client = new MoneyWorksClient(parsedOptions);
    }

    async syncAllInventoryFromMoneyworks() {
        let products: Awaited<ReturnType<MoneyWorksClient["getProducts"]>>;
        try {
            products = await this.client.getProducts();
        } catch (e) {
            throw new MedusaError(
                MedusaError.Types.DB_ERROR,
                "Could not fetch products from Moneyworks",
            );
        }
        const productsArraySchema = z.array(moneyworksProductSchema);
        let parsedProducts: z.infer<typeof productsArraySchema>;
        try {
            parsedProducts = productsArraySchema.parse(products);
        } catch (e) {
            throw new MedusaError(
                MedusaError.Types.DB_ERROR,
                "Could not parse products from Moneyworks",
            );
        }
        const filteredProducts = parsedProducts.filter(
            (product) => product.bardcode && product.stockonhand !== undefined,
        );

        // Update the variants by selecting them with barcode and updating the stock
        await Promise.all(
            filteredProducts.map(async (product) => {
                const variant = await this.variantRepository.findOne({
                    where: {
                        barcode: product.bardcode,
                    },
                });
                if (!variant || product.stockonhand === undefined) {
                    return;
                }
                variant.inventory_quantity = product.stockonhand;
                await this.variantRepository.save(variant);
            }),
        );
    }
}

export default MoneyworksProductService;
