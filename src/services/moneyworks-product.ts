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
import { optionsSchema } from '../lib/options'

export type MoneyworksProductData = {
    product_code: string;
};

const moneyworksProductSchema = z.object({
    code: z.coerce.string().optional(),
    stockonhand: z.coerce.number().optional(),
    barcode: z.coerce.string().optional(),
});

class MoneyworksProductService extends TransactionBaseService {
    protected client: MoneyWorksClient;
    protected variantRepository: Repository<ProductVariant>;

    constructor(container: any, options: Record<string, unknown>) {
        super(container);
        const parsedOptions = optionsSchema.parse(options);
        this.variantRepository = this.activeManager_.getRepository(ProductVariant);
        this.client = new MoneyWorksClient(parsedOptions);
    }

    async syncAllInventoryFromMoneyworks() {
        let products: Awaited<ReturnType<MoneyWorksClient["getProducts"]>>;
        try {
            products = await this.client.getProducts();
        } catch (e) {
            console.error('Could not fetch products from Moneyworks', e)
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
            console.error('Could not parse products from Moneyworks', e)
            throw new MedusaError(
                MedusaError.Types.DB_ERROR,
                "Could not parse products from Moneyworks",
            );
        }
        const filteredProducts = parsedProducts.filter(
            (product) => product.barcode && product.stockonhand !== undefined,
        );

        // Update the variants by selecting them with barcode and updating the stock
        await Promise.all(
            filteredProducts.map(async (product) => {
                let variant: ProductVariant | null = null;

                if (product.barcode) {
                    variant = await this.variantRepository.findOne({
                        where: {
                            barcode: product.barcode,
                        },
                    });
                }

                if (!variant && product.code) {
                    variant = await this.variantRepository.findOne({
                        where: {
                            sku: product.code,
                        },
                    });
                }

                if (!variant) {
                    return;
                }

                if (product.stockonhand !== undefined) {
                    variant.inventory_quantity = product.stockonhand;
                }
                // @ts-expect-error FIXME: check issue https://github.com/medusajs/medusa/issues/5241
                variant.sku ||= product.code ?? null;
                // @ts-expect-error FIXME: check issue https://github.com/medusajs/medusa/issues/5241
                variant.barcode ||= product.barcode ?? null;

                await this.variantRepository.save(variant);
            }),
        );
    }
}

export default MoneyworksProductService;
