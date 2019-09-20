/** @module jaid-core-dashboard */

import {isEmpty} from "has-content"
import router from "fast-koa-router"

export default class {

  constructor() {}

  getConfigSetup = {
    secretKeys: ["dashboardPassword"],
  }

  setCoreReference(core) {
    /**
     * @type {import("koa")}
     */
    this.koa = core.koa
  }

  handleConfig(config) {
    if (isEmpty(config.dashboardPassword)) {
      return false
    }
    this.dashboardPassword = config.dashboardPassword
  }

  init() {
    const routes = {
      get: {
        "/status": "",
      },
    }
    this.koa.use(router(routes))
  }

}