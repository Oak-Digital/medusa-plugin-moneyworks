import {
    EventBusService,
    Order,
    TransactionBaseService,
} from "@medusajs/medusa";
import { MoneyWorksClient } from "@oak-digital/moneyworks";
import { Repository } from "typeorm";
import { optionsSchema } from "../lib/options";

class MoneyworksInvoiceService extends TransactionBaseService {
    protected client: MoneyWorksClient;
    protected orderRepository_: Repository<Order>;
    protected eventBusService_: EventBusService;

    constructor(container: any, options: Record<string, unknown>) {
        super(container);
        const parsedOptions = optionsSchema.parse(options);
        this.orderRepository_ = this.activeManager_.getRepository(Order);
        this.client = new MoneyWorksClient(parsedOptions);
        this.eventBusService_ = container.eventBusService;
    }

    public async invoiceReady(
        invoiceId: string | number,
        orderDisplayId: number,
    ) {
        const order = await this.orderRepository_.findOne({
            where: { display_id: orderDisplayId },
            select: ["id"],
        });
        const orderId = order?.id;
        const invoiceResponse = await this.client.getInvoice(invoiceId);
        // FIXME: Do not use type casting
        const invoiceBuffer = invoiceResponse.data as any as Buffer;
        // TODO: Figure out if there is a better way to send the buffer
        const invoice = invoiceBuffer.toString("base64");
        await this.eventBusService_.emit('moneyworks.invoice.ready', {
            invoice,
            orderId,
        });
    }
}

export default MoneyworksInvoiceService;
