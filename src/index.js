/** @module jaid-core-dashboard */

import {isEmpty} from "has-content"
import {router} from "fast-koa-router"
import bodyMiddleware from "koa-better-body"

import loginPage from "./loginPage.hbs?html"
import statusPage from "./statusPage.hbs?html"

export default class DashboardPlugin {

  constructor() {
    this.path = "/status"
    this.cookieName = "dashboardPassword"
  }

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

  postInit() {
    this.templateContext = {
      title: this.core.camelName,
      formAction: this.path,
    }
  }

  /**
   * @param {import("koa")} koa
   */
  handleKoa(koa) {
    const routes = {
      [this.path]: {
        get: /** @param {import("koa").Context} context */ context => {
          const password = context.cookies.get(this.cookieName)
          if (password !== this.password) {
            if (password === undefined) {
              context.body = loginPage(this.templateContext)
              return
            } else {
              context.body = loginPage({
                ...this.templateContext,
                error: "Wrong password",
              })
              return
            }
          }
          context.body = statusPage({
            ...this.templateContext,
          })
        },
        post: /** @param {import("koa").Context} context */ context => {
          const password = context.request.fields?.password
          if (isEmpty(password)) {
            context.body = loginPage({
              ...this.templateContext,
              error: "No password entered",
            })
            return
          }
          if (password !== this.password) {
            context.body = loginPage({
              ...this.templateContext,
              error: "Wrong password",
            })
            return
          }
          context.cookies.set(this.cookieName, this.password)
          context.status = 303 // Important to redirect from POST to GET
          context.redirect(this.path)
        },
      },
    }
    koa.use(bodyMiddleware())
    koa.use(router(routes))
  }

}