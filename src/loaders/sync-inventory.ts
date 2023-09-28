import { AwilixContainer } from "awilix";
import { optionsSchema } from "../lib/options";
import MoneyworksProductService from '../services/moneyworks-product';

const syncInventory = async (
  container: AwilixContainer,
  options: Record<string, any>,
) => {
  const parsedOptions = optionsSchema.parse(options);
  if (parsedOptions.scheduledSyncString === null) {
    return;
  }
  const jobSchedulerService = container.resolve("jobSchedulerService");
  jobSchedulerService.create(
    "sync-moneyworks-inventory",
    {},
    parsedOptions.scheduledSyncString,
    async () => {
      const mwProductService: MoneyworksProductService = container.resolve("moneyworksProductService");
      await mwProductService.syncAllInventoryFromMoneyworks();
    },
  );
};

export default syncInventory;
