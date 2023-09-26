import { Column, Entity, ManyToOne, JoinColumn } from "typeorm";
import {
    // alias the core entity to not cause a naming conflict
    // Variant as MedusaVariant,
    ProductVariant as MedusaVariant,
} from "@medusajs/medusa";
import { MoneyworksProduct } from "./moneyworks-product";

@Entity()
export class ProductVariant extends MedusaVariant {
    @Column({ type: "varchar", nullable: true })
    mw_product_id: string;

    @ManyToOne(() => MoneyworksProduct, (mwProduct) => mwProduct.variants)
    @JoinColumn({ name: "mw_product_id" })
    mw_product: MoneyworksProduct;
}
