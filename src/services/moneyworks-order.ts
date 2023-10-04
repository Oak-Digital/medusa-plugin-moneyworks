import { Address, Order, TotalsService, TransactionBaseService } from "@medusajs/medusa";
import { MedusaError } from "@medusajs/utils";
import { MoneyWorksClient } from "@oak-digital/moneyworks";
import { encode } from "html-entities";
import { Repository } from "typeorm";
import { optionsSchema } from "../lib/options";

class MoneyworksOrderService extends TransactionBaseService {
    protected client: MoneyWorksClient;
    protected orderRepository_: Repository<Order>;
    private totalsService_: TotalsService;

    constructor(container: any, options: Record<string, unknown>) {
        super(container);
        const parsedOptions = optionsSchema.parse(options);
        this.orderRepository_ = this.activeManager_.getRepository(Order);
        this.client = new MoneyWorksClient(parsedOptions);
        this.totalsService_ = container.totalsService;
    }

    private getFullNameFromAddress(address: Address) {
        return `${address.first_name} ${address.last_name}`;
    }

    private formatAddress(address: Address) {
        const lines = [
            this.getFullNameFromAddress(address),
            address.address_1,
            address.address_2,
            address.city,
            address.postal_code,
            address.country?.display_name,
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
                "shipping_address",
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
        await this.client.createTransaction({
            type: "SOI",
            namecode: "WEB_ORDER",
            tofrom: encode(this.getFullNameFromAddress(order.billing_address), {
                level: "xml",
                mode: "nonAsciiPrintable",
            }),
            duedate: order.created_at,
            transdate: order.created_at,
            prodpricecode: "A",
            mailingaddress: this.formatAddress(order.billing_address),
            deliveryaddress: this.formatAddress(order.shipping_address),
            detail: await Promise.all(order.items.map(async (item) => {
                const gross = await this.totalsService_.getLineItemTotal(item, order, {
                    include_tax: true,
                })
                const net = await this.totalsService_.getLineItemTotal(item, order, {
                    include_tax: false,
                })
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
                };
            })),
        });
    }
}

export default MoneyworksOrderService;
