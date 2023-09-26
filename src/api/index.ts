import express, { Router } from "express"
import adminRouter from "./routes/admin"
import storeRouter from "./routes/store"
import { errorHandler } from "@medusajs/medusa"

export default (rootDirectory, options) => {
    const router = Router()

    router.use(express.json())
    router.use(express.urlencoded({ extended: true }))

    router.use("/admin", adminRouter(rootDirectory, options))
    router.use("/store", storeRouter(rootDirectory, options))

    router.use(errorHandler())

    return router
}
