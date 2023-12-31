import { Address, Order, TotalsService, TransactionBaseService } from "@medusajs/medusa";
import { MedusaError } from "@medusajs/utils";
import { MoneyWorksClient } from "@oak-digital/moneyworks";
import Handlebars from "handlebars";
import { encode } from "html-entities";
import { Repository } from "typeorm";
import { Options, optionsSchema } from "../lib/options";

class MoneyworksOrderService extends TransactionBaseService {
    protected client: MoneyWorksClient;
    protected orderRepository_: Repository<Order>;
    private totalsService_: TotalsService;
    private options_: Options;
    private nameCodeTemplate_: ReturnType<typeof Handlebars.compile>;
    private stockLocationTemplate_: ReturnType<typeof Handlebars.compile> | ((...args: any[]) => undefined | string);

    constructor(container: any, options: Record<string, unknown>) {
        super(container);
        const parsedOptions = optionsSchema.parse(options);
        this.options_ = parsedOptions;
        this.orderRepository_ = this.activeManager_.getRepository(Order);
        this.client = new MoneyWorksClient(parsedOptions);
        this.totalsService_ = container.totalsService;
        const handlebars: typeof Handlebars = parsedOptions.handlebars ?? Handlebars;
        this.nameCodeTemplate_ = handlebars.compile(parsedOptions.transactionNameCodeTemplate ?? 'WEB_ORDER');
        this.stockLocationTemplate_ = parsedOptions.transactionStockLocationTemplate ? handlebars.compile(parsedOptions.transactionStockLocationTemplate) : () => undefined;
    }

    private getFullNameFromAddress(address: Address) {
        return `${address.first_name} ${address.last_name}`;
    }

    private formatAddress(address: Address) {
        const address12String = [address.address_1, address.address_2].filter((l) => l).join(", ");
        const nameCompanyString = [this.getFullNameFromAddress(address), address.company].filter((l) => l).join(", ");

        const lines = [
            nameCompanyString,
            address12String,
            address.city,
            address.postal_code,
            address.country?.display_name ?? address.country_code,
        ];

        const addressString = lines
            .filter((l) => l)
            .map((l) => encode(l, { level: "xml", mode: "nonAsciiPrintable" }))
            .join("&#13;");

        return addressString;
    }

    async createOrderById(orderId: string) {
        const order = await this.orderRepository_.findOne({
            where: { id: orderId },
            relations: [
                "billing_address",
                "billing_address.country",
                "shipping_address",
                "shipping_address.country",
                "items",
                "items.variant",
                "items.tax_lines",
            ],
        });

        if (!order) {
            throw new MedusaError(MedusaError.Types.NOT_FOUND, "Order not found");
        }

        return this.createOrder(order);
    }

    async createOrder(order: Order) {
        const namecode = this.nameCodeTemplate_(order);
        const response = await this.client.createTransaction({
            return_seq: true,
            theirref: order.display_id,
            type: "DII",
            namecode,
            tofrom: encode(this.getFullNameFromAddress(order.billing_address), {
                level: "xml",
                mode: "nonAsciiPrintable",
            }),
            flag: "WEB",
            contra: this.options_.defaultContra,
            user2: order.customer?.phone ?? order.shipping_address?.phone ?? order.billing_address?.phone ?? undefined,
            user3: order.customer?.email ?? order.email ?? undefined,
            duedate: order.created_at,
            transdate: order.created_at,
            prodpricecode: "A",
            mailingaddress: this.formatAddress(order.billing_address),
            deliveryaddress: this.formatAddress(order.shipping_address),
            detail: await Promise.all(order.items.map(async (item) => {
                const gross = await this.totalsService_.getLineItemTotal(item, order, {
                    include_tax: true,
                }) / 100
                const net = await this.totalsService_.getLineItemTotal(item, order, {
                    include_tax: false,
                }) / 100
                const tax = gross - net;
                return {
                    net,
                    tax,
                    gross,
                    // TODO: Make this configurable
                    account: "1000-",
                    orderqty: item.quantity,
                    stockqty: item.quantity,
                    // TODO: Make this configurable
                    saleunit: "par",
                    // TODO: Figure out if this should be configurable
                    taxcode: "V",
                    stockcode: item.variant.sku,
                    unitprice: net / item.quantity,
                    description: item.title,
                    stocklocation: this.stockLocationTemplate_({
                        order,
                        item,
                    }),
                };
            })),
        });

        return response.data;
    }
}

export default MoneyworksOrderService;
