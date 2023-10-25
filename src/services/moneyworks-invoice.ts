import {
    EventBusService,
    Order,
    TransactionBaseService,
} from "@medusajs/medusa";
import { MoneyWorksClient } from "@oak-digital/moneyworks";
import { Repository } from "typeorm";
import { Options, optionsSchema } from "../lib/options";
import { INVOICE_FAILED_EVENT, INVOICE_READY_EVENT } from "../lib/events";

class MoneyworksInvoiceService extends TransactionBaseService {
    protected client: MoneyWorksClient;
    protected orderRepository_: Repository<Order>;
    protected eventBusService_: EventBusService;
    protected options_: Options;

    constructor(container: any, options: Record<string, unknown>) {
        super(container);
        const parsedOptions = optionsSchema.parse(options);
        this.orderRepository_ = this.activeManager_.getRepository(Order);
        this.client = new MoneyWorksClient(parsedOptions);
        this.eventBusService_ = container.eventBusService;
        this.options_ = parsedOptions;
    }

    public async invoiceReady(
        invoiceId: string | number,
        orderDisplayIdOrId: number | string,
    ) {
        let orderId = typeof orderDisplayIdOrId === "string" ? orderDisplayIdOrId : undefined;

        if (typeof orderDisplayIdOrId === "number") {
            const order = await this.orderRepository_.findOne({
                where: { display_id: orderDisplayIdOrId },
                select: ["id"],
            });
            orderId = order?.id;
        }

        if (!orderId) {
            throw new Error("Order not found for invoice ready event");
        }

        try {
            const invoiceResponse = await this.client.getInvoice(
                invoiceId,
                this.options_.invoiceForm,
            );
            // FIXME: Do not use type casting
            const invoiceBuffer = invoiceResponse.data as any as Buffer;
            // TODO: Figure out if there is a better way to send the buffer
            const invoice = invoiceBuffer.toString("base64");
            await this.eventBusService_.emit(INVOICE_READY_EVENT, {
                invoice,
                id: orderId,
            });
        } catch (error) {
            await this.invoiceFailed(orderId, invoiceId);
        }
    }

    public async invoiceFailed(
        orderId: string,
        invoiceId?: string | number,
    ) {
        await this.eventBusService_.emit(INVOICE_FAILED_EVENT, {
            id: orderId,
            invoiceId,
        });
    }
}

export default MoneyworksInvoiceService;
