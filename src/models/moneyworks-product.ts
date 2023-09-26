import {
    BeforeInsert,
    Column,
    Entity,
    PrimaryColumn,
    OneToMany,
    Index,
} from "typeorm";
import { BaseEntity } from "@medusajs/medusa";
import { generateEntityId } from "@medusajs/medusa/dist/utils";
import { ProductVariant } from "./variant";

@Entity()
export class MoneyworksProduct extends BaseEntity {
    @Index({ unique: true })
    @Column({ type: "varchar", nullable: false, unique: true })
    product_code: string;

    @Column({ type: "bigint", nullable: false, default: 0 })
    stock: number

    @OneToMany(() => ProductVariant, (variant) => variant.mw_product)
    variants: ProductVariant[];

    // @BeforeInsert()
    // private beforeInsert(): void {
    //     this.id = generateEntityId(this.id, "mwpr");
    // }
}
