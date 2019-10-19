/** @module jaid-core-dashboard */

/**
 * @typedef Options
 * @prop {number} lineCount
 * @prop {string} cookieName
 * @prop {string} path
 */

import path from "path"
import os from "os"

import filesize from "filesize"
import {isEmpty} from "has-content"
import {router} from "fast-koa-router"
import bodyMiddleware from "koa-better-body"
import globby from "globby"
import fsp from "@absolunet/fsp"
import readLastLines from "read-last-lines"
import {orderBy} from "lodash"
import readableMs from "readable-ms"

import loginPage from "./loginPage.hbs?html"
import statusPage from "./statusPage.hbs?html"

const colors = {
  warn: "#ffb861",
  error: "#ff5a5a",
  info: "#5ad1ff",
  debug: "#475ed2",
}

const defaultColor = "#BBB"

export default class DashboardPlugin {

  /**
   * @constructor
   * @param {Options} options
   */
  constructor(options = {}) {
    this.path = options.path || "/status"
    this.cookieName = options.cookieName || "dashboardPassword"
    this.lineCount = options.lineCount || 20
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
        get: /** @param {import("koa").Context} context */ async context => {
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
          const logFiles = await globby("*.txt", {
            cwd: this.core.logFolder,
          })
          const getLogsJobs = logFiles.map(async logFile => {
            const fullLogFile = path.join(this.core.logFolder, logFile)
            const stat = await fsp.stat(fullLogFile)
            const size = stat.size
            const logInfo = {
              size,
              modifiedTime: stat.mtimeMs,
              sizeString: filesize(size),
              name: logFile,
              fullPath: fullLogFile,
            }
            if (size > 0) {
              const linesString = await readLastLines.read(fullLogFile, this.lineCount)
              logInfo.lines = linesString.trim().split("\n").map(line => {
                const lineMatch = /(?<date>[\d.:]+) +(?<level>[a-z]+?)] +(?<message>.*)/i.exec(line)
                if (lineMatch.groups) {
                  lineMatch.groups.levelId = lineMatch.groups.level.toLowerCase()
                  lineMatch.groups.color = colors[lineMatch.groups.levelId] || defaultColor
                  return lineMatch.groups
                }
                return {
                  line,
                }
              })
            }
            return logInfo
          })
          const logs = await Promise.all(getLogsJobs)
          const logsSorted = orderBy(logs, ["modifiedTime"], ["desc"])
          const freeBytes = os.freemem()
          const totalBytes = os.totalmem()
          const usedByes = totalBytes - freeBytes
          context.body = statusPage({
            logs: logsSorted,
            infoBlocks: [
              {
                key: "Status",
                value: this.templateContext.title,
              },
              {
                key: "Runtime",
                value: readableMs(Date.now() - this.core.startTime),
              },
              {
                key: "RAM Usage",
                value: `${Math.floor(usedByes / totalBytes * 100)}%`,
              },
            ],
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