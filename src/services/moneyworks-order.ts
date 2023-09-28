import { Address, Order, TransactionBaseService } from "@medusajs/medusa";
import { MedusaError } from "@medusajs/utils";
import { MoneyWorksClient } from "@oak-digital/moneyworks";
import { Repository } from "typeorm";
import { optionsSchema } from "../lib/options";

class MoneyworksOrderService extends TransactionBaseService {
    protected client: MoneyWorksClient;
    protected orderRepository_: Repository<Order>;

    constructor(container: any, options: Record<string, unknown>) {
        super(container);
        const parsedOptions = optionsSchema.parse(options);
        this.orderRepository_ = this.activeManager_.getRepository(Order);
        this.client = new MoneyWorksClient(parsedOptions);
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

        const addressString = lines.filter((l) => l).join("&#13;");

        return addressString;
    }

    async createOrderById(orderId: string) {
        const order = await this.orderRepository_.findOne({
            where: { id: orderId },
            relations: ["billing_address", "shipping_address", "items", "items.variant"],
        });

        if (!order) {
            throw new MedusaError(MedusaError.Types.NOT_FOUND, "Order not found");
        }

        return this.createOrder(order);
    }

    async createOrder(order: Order) {
        const { first_name, last_name } = order.billing_address;
        await this.client.createTransaction({
            type: "SOI",
            flag: "EDI",
            namecode: "WEB_ORDER",
            tofrom: `${first_name} ${last_name}`,
            duedate: order.created_at,
            transdate: order.created_at,
            prodpricecode: "A",
            mailingaddress: this.formatAddress(order.billing_address),
            deliveryaddress: this.formatAddress(order.shipping_address),
            detail: order.items.map((item) => {
                const net =
                    (item.total ?? item.unit_price * item.quantity) -
                    (item.includes_tax ? item.tax_total ?? 0 : 0);
                const tax = item.tax_total ?? 0;
                return {
                    net,
                    tax,
                    gross: net + tax,
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
            }),
        });
    }
}

export default MoneyworksOrderService;
