import {
    BeforeInsert,
    Column,
    Entity,
    PrimaryColumn,
    OneToMany,
} from "typeorm";
import { BaseEntity } from "@medusajs/medusa";
import { generateEntityId } from "@medusajs/medusa/dist/utils";
import { ProductVariant } from "./variant";

@Entity()
export class MoneyworksProduct extends BaseEntity {
    @Column({ type: "varchar", nullable: false })
    product_code: string;

    @OneToMany(() => ProductVariant, (variant) => variant.mw_product)
    variants: ProductVariant[];

    @BeforeInsert()
    private beforeInsert(): void {
        this.id = generateEntityId(this.id, "mwpr");
    }
}
