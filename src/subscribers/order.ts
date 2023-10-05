import MoneyworksInvoiceService from "../services/moneyworks-invoice";
import MoneyworksOrderService from "../services/moneyworks-order";

class OrderSubscriber {
    private moneyworksOrderService_: MoneyworksOrderService;
    private moneyworksInvoiceService_: MoneyworksInvoiceService;

    constructor({ eventBusService, moneyworksOrderService, moneyworksInvoiceService }) {
        this.moneyworksOrderService_ = moneyworksOrderService;
        this.moneyworksInvoiceService_ = moneyworksInvoiceService;
        eventBusService.subscribe("order.placed", this.handleOrder.bind(this));
    }

    async handleOrder(order: { id: string, no_notification: boolean }) {
        const sequenceNumber = await this.moneyworksOrderService_.createOrderById(order.id);

        if (order.no_notification) {
            return;
        }

        await this.moneyworksInvoiceService_.invoiceReady(sequenceNumber, order.id);
    }
}

export default OrderSubscriber;
