import path from "path"

import JaidCore from "jaid-core"
import getPort from "get-port"
import fsp from "@absolunet/fsp"
import delay from "delay"
import ms from "ms.macro"

const indexModule = (process.env.MAIN ? path.resolve(process.env.MAIN) : path.join(__dirname, "..", "src")) |> require

/**
 * @type { import("../src") }
 */
const {default: JaidCoreDashboard} = indexModule

it("should run", async () => {
  let statusCode
  const insecurePort = await getPort()
  const dashboardPlugin = new JaidCoreDashboard()
  const core = new JaidCore({
    insecurePort,
    name: _PKG_TITLE,
    folder: ["Jaid", _PKG_TITLE, "test", new Date().toISOString()],
    version: _PKG_VERSION,
    useGot: true,
  })
  const secretsFile = path.join(core.appFolder, "secrets.yml")
  await fsp.writeYaml(secretsFile, {dashboardPassword: "hunter2"})
  const testClientClass = class {

    init() {
      this.got = core.got.extend({
        baseUrl: "http://localhost",
        port: insecurePort,
      })
    }

    async ready() {
      const response = await this.got("status")
      statusCode = response.statusCode
    }

  }
  await core.init({
    dashboard: dashboardPlugin,
    test: testClientClass,
  })
  await delay(ms`1 second`)
  expect(statusCode).toBe(200)
  await core.close()
})