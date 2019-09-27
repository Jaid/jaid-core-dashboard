import path from "path"

import JaidCore from "jaid-core"
import getPort from "get-port"
import fsp from "@absolunet/fsp"
import delay from "delay"
import ms from "ms.macro"
import nanoid from "nanoid"
import FormData from "form-data"

const indexModule = (process.env.MAIN ? path.resolve(process.env.MAIN) : path.join(__dirname, "..", "src")) |> require

/**
 * @type { import("../src") }
 */
const {default: JaidCoreDashboard} = indexModule

it("should run", async () => {
  let statusCode
  const insecurePort = await getPort()
  const dashboardPassword = nanoid()
  const dashboardPlugin = new JaidCoreDashboard()
  const core = new JaidCore({
    insecurePort,
    name: _PKG_TITLE,
    folder: ["Jaid", _PKG_TITLE, "test", new Date().toISOString()],
    version: _PKG_VERSION,
    useGot: true,
  })
  const secretsFile = path.join(core.appFolder, "secrets.yml")
  await fsp.writeYaml(secretsFile, {
    dashboardPassword,
    formAction: "/status",
  })
  const testClientClass = class {

    init() {
      this.got = core.got.extend({
        baseUrl: "http://localhost",
        port: insecurePort,
      })
    }

    async ready() {
      const response = await this.got("status")
      expect(response.statusCode).toBe(200)
      expect(response.body).toMatch("action=\"/status\"")
      const form = new FormData
      form.append("password", dashboardPassword)
      const loginResponse = await this.got.post("status", {
        body: form,
      })
      core.logger.info(loginResponse.body)
    }

  }
  await core.init({
    dashboard: dashboardPlugin,
    test: testClientClass,
  })
  await delay(ms`30 seconds`)
  expect(statusCode).toBe(200)
  await core.close()
}, ms`40 seconds`)