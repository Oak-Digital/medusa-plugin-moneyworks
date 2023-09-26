import {
    buildQuery,
    FindConfig,
    Selector,
    TransactionBaseService,
} from "@medusajs/medusa";
import { Repository } from "typeorm";
import { MoneyworksProduct } from "../models/moneyworks-product";
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
});

class MoneyworksProductService extends TransactionBaseService {
    protected repository: Repository<MoneyworksProduct>;
    protected client: MoneyWorksClient;

    constructor(container: any, options: Record<string, unknown>) {
        super(container);
        this.repository = this.activeManager_.getRepository(MoneyworksProduct);
        const parsedOptions = optionsSchema.parse(options);
        this.client = new MoneyWorksClient(parsedOptions);
    }

    // async findOne(id) {
    //     return this.activeManager_.findOne(MoneyworksProduct, id)
    // }

    async upsert(data: MoneyworksProductData) {
        return this.repository.upsert(
            {
                ...data,
            },
            {
                conflictPaths: {
                    product_code: true,
                },
            },
        );
    }

    async syncAllFromMoneyworks() {
        const products = await this.client.getProducts();
        const parsedProducts = z.array(moneyworksProductSchema).parse(products);
        const filteredProducts = parsedProducts.filter((product) => product.code);
        return this.repository.upsert(
            filteredProducts.map((product) => ({
                product_code: product.code,
                stock: product.stockonhand,
            })),
            {
                conflictPaths: {
                    product_code: true,
                },
            },
        );
    }

    async list(
        selector: Selector<MoneyworksProduct> = {},
        config: FindConfig<MoneyworksProduct> = {
            skip: 0,
            take: 20,
            relations: [],
        },
    ) {
        const query = buildQuery(selector, config);
        return this.repository.find(query);
    }

    /**
    * Finds all moneyworks products without variants
    */
    async listWithoutVariant(
        selector: Selector<MoneyworksProduct> = {},
        config: FindConfig<MoneyworksProduct> = {
            skip: 0,
            take: 20,
            relations: [],
        },
    ) {
        const query = buildQuery(selector, config);
        return this.repository.find({
            ...query,
            where: {
                ...query.where,
                variants: [],
            },
        });
    }

    // getMessage() {
    //     return `Welcome to My Store!`;
    // }
}

export default MoneyworksProductService;
