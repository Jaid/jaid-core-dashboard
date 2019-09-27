/** @module jaid-core-dashboard */

import {isEmpty} from "has-content"
import {router} from "fast-koa-router"
import bodyMiddleware from "koa-better-body"
import composeMiddleware from "koa-compose"

import loginPage from "./loginPage.hbs?html"

export default class DashboardPlugin {

  constructor() {}

  setCoreReference(core) {
    /**
     * @type {import("jaid-core").default}
     */
    this.core = core
  }

  getConfigSetup = {
    secretKeys: ["dashboardPassword"],
  }

  /**
   * @param {import("jaid-core").BaseConfig} config
   */
  handleConfig(config) {
    if (isEmpty(config.dashboardPassword)) {
      return false
    }
    this.password = config.dashboardPassword
  }

  /**
   * @param {import("koa")} koa
   */
  handleKoa(koa) {
    const routes = {
      "/status": {
        get: /** @param {import("koa").Context} context */ context => {
          context.body = loginPage({
            title: this.core.camelName,
            formAction: "/status",
          })
        },
        post: /** @param {import("koa").Context} context */ context => {
          const templateContext = {
            title: this.core.camelName,
            formAction: "/status",
          }
          const password = context.request.fields?.password
          if (isEmpty(password)) {
            context.body = loginPage({
              ...templateContext,
              error: "No password entered",
            })
            return
          }
          if (password !== this.password) {
            context.body = loginPage({
              ...templateContext,
              error: "Wrong password",
            })
            return
          }
          context.cookies.set("password", this.password)
          context.redirect("/status")
        },
      },
    }
    koa.use(bodyMiddleware())
    koa.use(router(routes))
  }

}