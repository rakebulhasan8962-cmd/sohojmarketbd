import { pgTable, serial, text, varchar, timestamp, integer, jsonb } from "drizzle-orm/pg-core";

export const siteContent = pgTable("site_content", {
  id: serial("id").primaryKey(),
  content: jsonb("content").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  whatsappNumber: varchar("whatsapp_number", { length: 50 }).notNull().default("8801639193531"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address").notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  shippingArea: varchar("shipping_area", { length: 50 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
  subtotal: integer("subtotal").notNull(),
  shippingFee: integer("shipping_fee").notNull(),
  total: integer("total").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});