import { Order } from "@medusajs/medusa";
import MoneyworksOrderService from "../services/moneyworks-order";

class OrderSubscriber {
    private moneyworksOrderService_: MoneyworksOrderService;

    constructor({ eventBusService, moneyworksOrderService }) {
        this.moneyworksOrderService_ = moneyworksOrderService;
        eventBusService.subscribe("order.placed", this.handleOrder.bind(this));
    }

    async handleOrder(order: { id: string }) {
        await this.moneyworksOrderService_.createOrderById(order.id);
    }
}

export default OrderSubscriber;
