/** @module jaid-core-dashboard */

import {isEmpty} from "has-content"
import {router} from "fast-koa-router"

export default class DashboardPlugin {

  constructor() {}

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
    this.dashboardPassword = config.dashboardPassword
  }

  /**
   * @param {import("koa")} koa
   */
  handleKoa(koa) {
    const routes = {
      get: {
        "/status": async context => {
          context.body = "hi"
        },
      },
    }
    koa.use(router(routes))
  }

}