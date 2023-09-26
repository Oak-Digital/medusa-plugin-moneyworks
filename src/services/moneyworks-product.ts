import { TransactionBaseService } from "@medusajs/medusa";
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
    dataFile: z.string().optional(),
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

    constructor(container, options) {
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
        this.repository.upsert(filteredProducts.map((product) => ({
            product_code: product.code,
            stock: product.stockonhand,
        })), {
            conflictPaths: {
                product_code: true,
            },
        });
    }

    // getMessage() {
    //     return `Welcome to My Store!`;
    // }
}

export default MoneyworksProductService;
